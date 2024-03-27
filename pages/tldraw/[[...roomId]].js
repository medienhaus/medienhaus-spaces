import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import _ from 'lodash';
import {
    ClientEvent,
    createClient as createMatrixClient,
    EventTimeline,
    EventType,
    Filter,
    RoomEvent,
    TimelineWindow,
} from 'matrix-js-sdk';
import { RiUserAddLine } from '@remixicon/react';
import pino from 'pino';
import { useImmer } from 'use-immer';

import { useAuth } from '@/lib/Auth';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { useMatrix } from '@/lib/Matrix';
import { ServiceSubmenu } from '@/components/UI/ServiceSubmenu';
import DefaultLayout from '@/components/layouts/default';
import { ServiceTable } from '@/components/UI/ServiceTable';
import ServiceLink from '@/components/UI/ServiceLink';
import { path as tldrawPath } from '@/lib/Tldraw';
import CreateNewTldraw from './actions/CreateNewTldraw';
import CopyToClipboard from '@/components/UI/CopyToClipboard';
import { InviteUserToMatrixRoom } from '@/components/UI/InviteUsersToMatrixRoom';
import TextButton from '@/components/UI/TextButton';
import Icon from '@/components/UI/Icon';
import logger from '@/lib/Logging';

const TldrawEditor = dynamic(() => import('@/components/TldrawEditor'), { ssr: false });

export default function Tldraw() {
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const { t } = useTranslation('tldraw');
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');
    const serviceSpaceId = matrix.serviceSpaces.tldraw;
    const spacedeckChildren = matrix.spaces.get(serviceSpaceId)?.children?.filter((child) => child !== 'undefined'); // Filter out any undefined values to ensure 'spacedeckChildren' only contains valid objects

    const [editor, setEditor] = useState();
    const [initialSyncDone, setInitialSyncDone] = useState(false);
    const [shapesWithPendingChanges, setShapesWithPendingChanges] = useImmer(new Set());

    /** @type {MatrixClient} */
    const roomSpecificMatrixClient = useMemo(() => {
        if (!roomId) return;

        logger.error('fnwbr Create new matrixclient');

        return createMatrixClient({
            baseUrl: matrixClient.getHomeserverUrl(),
            accessToken: matrixClient.getAccessToken(),
            userId: matrixClient.getUserId(),
            useAuthorizationHeader: true,
            timelineSupport: true,
            // Hide all of the matrix-js-sdk logging output
            logger: pino({ level: 'error' }),
        });
        // We only want to create a new room-specific Matrix client when the roomId changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    // Debugging
    const [selectedShapeMeta, setSelectedShapeMeta] = useImmer();

    // Whenever the roomId changes (e.g. after a new item was created), automatically focus that element.
    // This makes the sidebar scroll to the element if it is outside of the current viewport.
    const selectedDrawRef = useRef(null);
    useEffect(() => {
        setInitialSyncDone(false);
        selectedDrawRef.current?.focus();
    }, [roomId]);

    const handleChangeInTldrawEditor = useCallback(
        async (change) => {
            // Added
            for (const record of Object.values(change.changes.added)) {
                // Some shapes like "draw" and "highlight" support the `isComplete` property, which tells us, if the
                // user has not completed drawing the shape yet. In that case we won't send the shape to the Matrix yet.
                if (_.has(record, 'props.isComplete') && !record.props.isComplete) continue;

                if (record.typeName === 'shape') {
                    await roomSpecificMatrixClient.sendMessage(roomId, {
                        msgtype: 'dev.medienhaus.tldraw.store.store',
                        body: JSON.stringify({ [record.id]: record }),
                    });
                } else {
                    console.warn('Added a new tldraw object that we do not know how to handle', record);
                }
            }

            // Updated
            for (const [from, to] of Object.values(change.changes.updated)) {
                if (from.typeName === 'instance' && to.typeName === 'instance' && from.currentPageId !== to.currentPageId) {
                    logger.log(`fnwbr changed page (${from.currentPageId}, ${to.currentPageId})`);
                    // @TODO Handle pages
                } else if (from.id.startsWith('shape') && to.id.startsWith('shape')) {
                    if (roomSpecificMatrixClient.getRoom(roomId).findEventById(from.meta.eventId)) {
                        // This is a type of change that happens so often, that we'd spam the Matrix if we were to just
                        // send them off. Instead we have add this change to our own state `shapesWithPendingChanges`
                        // which we will periodically check for new entries, to then send updates to the Matrix.
                        setShapesWithPendingChanges(
                            /** @param {Set} draft */
                            (draft) => {
                                draft.add(from.id);
                            },
                        );
                    } else if (_.has(to, 'props.isComplete')) {
                        // This is a type of shape that supports the "isComplete" property
                        // If the user is still messing with this shape, then we ignore the changes ...
                        if (!to.props.isComplete) continue;

                        // ... but otherwise we assume that this is a new object, given we do not have a Matrix eventId on it
                        await roomSpecificMatrixClient.sendMessage(roomId, {
                            msgtype: 'dev.medienhaus.tldraw.store.store',
                            body: JSON.stringify({ [to.id]: to }),
                        });
                    } else {
                        // Unexpected error
                        logger.warn('We have updated a shape that we do not know how to handle...');
                    }
                }
            }

            // Removed
            for (const record of Object.values(change.changes.removed)) {
                if (record.typeName === 'shape') {
                    if (roomSpecificMatrixClient.getRoom(roomId).findEventById(record.meta.eventId)) {
                        await roomSpecificMatrixClient.redactEvent(roomId, record.meta.eventId);
                        //@todo redact also all other events in the thread and not only the root one
                    }
                }
            }
        },
        [roomId, roomSpecificMatrixClient, setShapesWithPendingChanges],
    );

    const SyncEvent = useCallback(
        (newState, prevState) => {
            if (newState === 'SYNCING' && prevState === 'PREPARED') {
                setInitialSyncDone(true);
            }
        },
        [setInitialSyncDone],
    );

    const LocalEchoUpdatedEvent = useCallback(
        /**
         *
         * @param {MatrixEvent} event
         * @param {Room} room
         * @param {string} [oldEventId]
         * @param {string} [oldStatus] https://github.com/matrix-org/matrix-js-sdk/blob/92342c07edb6fcc73f0ed9d8fbcfb362970a8692/src/models/event-status.ts
         */
        (event, room, oldEventId, oldStatus) => {
            if (event.isSending() || oldStatus !== 'sent') return;
            // If this is the new event ID for something inside a thread we do not care... we always store the root IDs
            logger.log({ ...event });
            if (event.hasAssociation()) return;

            // We need to update the matrixEventId inside tldraw's store
            editor.store.mergeRemoteChanges(() => {
                const x = JSON.parse(event.getContent().body);
                logger.log('now changing the metaEventId of shape', Object.keys(x)[0], {
                    ...x[Object.keys(x)[0]],
                    ...{ meta: { eventId: event.getId() } },
                });
                editor.store.put([{ ...x[Object.keys(x)[0]], ...{ meta: { eventId: event.getId() } } }]);
            });
        },
        [editor],
    );

    const RoomRedactionEvent = useCallback(
        /**
         * @param {MatrixEvent} event
         * @param {Room} room
         * @param {string} [threadRootId] The thread containing the redacted event (before it was redacted)
         */
        (event, room, threadRootId) => {
            // getAssociatedId() gives us the original event ID of the event that was redacted (deleted)
            const redactedEvent = event.getAssociatedId();
            const shapeToBeDeleted = _.find(editor.store.allRecords(), (record) => record.meta.eventId === redactedEvent);

            if (shapeToBeDeleted) {
                editor.store.mergeRemoteChanges(() => {
                    editor.store.remove([shapeToBeDeleted.id]);
                });
            }
        },
        [editor],
    );

    const RoomTimelineEvent = useCallback(
        /**
         * @param {MatrixEvent} event
         * @param {Room} room
         */
        (event, room) => {
            // Because of the filter defined above this shouldn't ever happen, BUT:
            // If this is a timeline event for a room other than the one we're looking at, we want to ignore it
            if (event.getRoomId() !== roomId) return;

            // Obviously, redacted events represent shapes that got deleted.
            if (event.isRedacted()) {
                return;
            }

            // Also, if this event is a thread reply, we need to check if the root was redacted, which in turn means
            // that the represented shape was deleted.
            if (event.getRelation() && room.findEventById(event.getAssociatedId())?.isRedacted()) {
                return;
            }

            if (event.getType() === EventType.RoomMessage && event.getContent().msgtype === 'dev.medienhaus.tldraw.store.store') {
                const content = JSON.parse(event.getContent()?.body);
                if (!content) return;

                // Something like "shape:htSmQEhefADUH6jcuCCzZ"
                const shapeIdentifier = Object.keys(content)[0];

                // If this RoomTimelineEvent is older than the version we have in store, we want to ignore it
                if (editor.store.get(shapeIdentifier)?.meta.ts > event.getTs()) {
                    return;
                }

                let newStoreEntry = {
                    [shapeIdentifier]: { ...content[shapeIdentifier], ...{ meta: { eventId: event.getId(), ts: event.getTs() } } },
                };

                if (event.getRelation()) {
                    const newContent = JSON.parse(event.getContent().body);
                    newStoreEntry = {
                        [shapeIdentifier]: {
                            ...newContent[shapeIdentifier],
                            ...{ meta: { eventId: event.threadRootId, ts: event.getTs() } },
                        },
                    };
                }

                console.log(
                    'Found this object in the Matrix, so merging this into the editor',
                    newStoreEntry[Object.keys(newStoreEntry)[0]],
                );

                editor.store.mergeRemoteChanges(() => {
                    editor.store.put([newStoreEntry[shapeIdentifier]]);
                });
            }
        },
        [roomId, editor],
    );

    const updateShapeInMatrix = useCallback(
        async (shape) => {
            /** @type {MatrixEvent | undefined} */
            const lastEventInThread = roomSpecificMatrixClient.getRoom(roomId).getThread(shape.meta.eventId)?.replyToEvent;

            if (lastEventInThread) {
                await roomSpecificMatrixClient.sendMessage(roomId, {
                    'msgtype': 'dev.medienhaus.tldraw.store.store',
                    'body': JSON.stringify({ [shape.id]: shape }),
                    'm.relates_to': {
                        'rel_type': 'm.thread',
                        'event_id': shape.meta.eventId,
                        'is_falling_back': true,
                        'm.in_reply_to': {
                            event_id: lastEventInThread.getId(),
                        },
                    },
                });
            } else {
                await roomSpecificMatrixClient.sendMessage(roomId, shape.meta.eventId, {
                    msgtype: 'dev.medienhaus.tldraw.store.store',
                    body: JSON.stringify({ [shape.id]: shape }),
                });
            }
        },
        [roomId, roomSpecificMatrixClient],
    );

    const sendPendingUpdatesToMatrix = useCallback(async () => {
        if (shapesWithPendingChanges.size < 1) return;

        logger.debug(`Send pending changes for ${shapesWithPendingChanges.size} shape(s) to Matrix ...`);

        shapesWithPendingChanges.forEach(async (shapeId) => {
            const shape = editor.store.get(shapeId);

            if (!shape) {
                // The shape that was recently changed seems to not exist anymore...
                // It's most likely that it was deleted in the meantime.
                logger.debug(`Skipping changes for ${shapeId} because it looks like it's gone`);
            }

            updateShapeInMatrix(shape);
        });

        // Clear the list of shapes with pending changes again
        setShapesWithPendingChanges((draft) => new Set());
    }, [editor, setShapesWithPendingChanges, shapesWithPendingChanges, updateShapeInMatrix]);

    useEffect(() => {
        if (!editor) return;

        const cleanupFunction = editor.store.listen(handleChangeInTldrawEditor, { source: 'user', scope: 'document' });
        const sendUpdatesToMatrix = setInterval(sendPendingUpdatesToMatrix, 2500);
        const cleanupFunctionDebugging = editor.store.listen((change) => {
            // New selected
            if (editor.getOnlySelectedShape()) {
                setSelectedShapeMeta({
                    shapeId: editor.getOnlySelectedShape().id,
                    ...editor.getOnlySelectedShape().meta,
                });
            } else {
                setSelectedShapeMeta(null);
            }
        });

        return () => {
            cleanupFunction();
            clearInterval(sendUpdatesToMatrix);
            cleanupFunctionDebugging();
        };
        // @TODO This seems to trigger way too often... did I add too many dependencies?
    }, [editor, handleChangeInTldrawEditor, sendPendingUpdatesToMatrix, setSelectedShapeMeta]);

    useEffect(() => {
        if (!roomSpecificMatrixClient) return;
        if (!editor) return;

        const letsgo = async () => {
            logger.warn('fnwbr Initial population of store, async!');

            const stateStoreSchema = await roomSpecificMatrixClient.getStateEvent(roomId, 'dev.medienhaus.tldraw.store.schema', '');
            const stateStoreStore = await roomSpecificMatrixClient.getStateEvent(roomId, 'dev.medienhaus.tldraw.store.store', '');

            editor.store.loadSnapshot({
                store: stateStoreStore,
                schema: stateStoreSchema,
            });

            logger.debug('Attaching event listeners to room-specific Matrix client', roomId);
            roomSpecificMatrixClient.on(RoomEvent.LocalEchoUpdated, LocalEchoUpdatedEvent);
            roomSpecificMatrixClient.on(RoomEvent.Timeline, RoomTimelineEvent);
            roomSpecificMatrixClient.on(RoomEvent.Redaction, RoomRedactionEvent);
            roomSpecificMatrixClient.on(ClientEvent.Sync, SyncEvent);

            // We filter two things:
            // 1. Ignore all presence events of other users; we do not care about those right now
            // 2. Only care about events in the room of the given roomId
            const filter = new Filter(roomSpecificMatrixClient.getUserId());
            filter.setDefinition({
                presence: {
                    not_types: ['*'],
                },
                room: {
                    rooms: [roomId],
                },
            });

            logger.debug('Starting /sync call for room-specific Matrix client', roomId);
            roomSpecificMatrixClient.startClient({
                lazyLoadMembers: true,
                threadSupport: true,
                filter: filter,
            });
        };

        letsgo();

        return () => {
            logger.debug('Unsubscribing event listeners and stopping room-specific Matrix client', roomId);
            roomSpecificMatrixClient.off(ClientEvent.Sync, SyncEvent);
            roomSpecificMatrixClient.off(RoomEvent.Redaction, RoomRedactionEvent);
            roomSpecificMatrixClient.off(RoomEvent.Timeline, RoomTimelineEvent);
            roomSpecificMatrixClient.off(RoomEvent.LocalEchoUpdated, LocalEchoUpdatedEvent);
            roomSpecificMatrixClient.stopClient();
        };
    }, [LocalEchoUpdatedEvent, RoomRedactionEvent, RoomTimelineEvent, SyncEvent, editor, roomId, roomSpecificMatrixClient]);

    useEffect(() => {
        const getAllEvents = async () => {
            if (!initialSyncDone) return;
            if (!roomSpecificMatrixClient.getRoom(roomId)) return;

            logger.warn('fnwbr matrix-client INITIAL SYNC DONE');

            const room = roomSpecificMatrixClient.getRoom(roomId);

            // Check if we have permission to send messages in this Matrix room; because otherwise
            // we're in a read-only-mode and need to tell tldraw about it.
            editor.updateInstanceState({
                isReadonly: !room.getLiveTimeline().getState(EventTimeline.FORWARDS).maySendMessage(roomSpecificMatrixClient.getUserId()),
            });

            const x = new TimelineWindow(roomSpecificMatrixClient, room.getUnfilteredTimelineSet());
            x.load();

            logger.log('fnwbr', x);
            logger.log('fnwbr can paginate?', x.canPaginate(EventTimeline.BACKWARDS));
            logger.log('fnwbr paginate', await x.paginate(EventTimeline.BACKWARDS, 1000));
            logger.log('fnwbr', x);
            logger.log('fnwbr can paginate?', x.canPaginate(EventTimeline.BACKWARDS));
            logger.log('fnwbr paginate', await x.paginate(EventTimeline.BACKWARDS, 1000));
            logger.log('fnwbr', x);
            logger.log('fnwbr can paginate?', x.canPaginate(EventTimeline.BACKWARDS));
            // @TODO Keep paginating until we don't need to anymore
            editor.updateInstanceState({ isFocused: true });
        };

        getAllEvents();
    }, [editor, initialSyncDone, roomId, roomSpecificMatrixClient]);

    // based on the createWriteRoom in etherpad. there was a @TODO mentioned with 'function creates infinite loop in useEffect below' dont know if this applies here as well.
    const createSketchRoom = useCallback(
        async (name) => {
            if (!name) return;

            const newRoom = await matrix.createRoom(name, false, '', 'invite', 'content', 'tldraw', serviceSpaceId);

            // we add the defualt store schama data and the store data as an custom stateevent to the newly created room
            await matrixClient.sendStateEvent(
                newRoom,
                'dev.medienhaus.tldraw.store.schema',
                // @TODO: Filter out tldraw utils that we do not want / do not support at the moment (e.g. image upload)
                (await import('tldraw')).createTLStore({}).schema.serialize(),
            );
            await matrixClient.sendStateEvent(
                newRoom,
                'dev.medienhaus.tldraw.store.store',
                JSON.stringify({
                    'document:document': {
                        gridSize: 10,
                        name: '',
                        meta: {},
                        id: 'document:document',
                        typeName: 'document',
                    },
                    'page:page': { meta: {}, id: 'page:page', name: 'Page 1', index: 'a1', typeName: 'page' },
                }),
            );

            await auth.getAuthenticationProvider('matrix').addSpaceChild(matrix.serviceSpaces.tldraw, newRoom);

            return newRoom;
        },
        [auth, matrix, matrixClient, serviceSpaceId],
    );

    return (
        <>
            <DefaultLayout.Sidebar>
                <ServiceSubmenu
                    title={<h2>{tldrawPath}</h2>}
                    subheadline={t('What would you like to do?')}
                    disabled={!serviceSpaceId}
                    items={[
                        {
                            value: 'createNew',
                            actionComponentToRender: <CreateNewTldraw createTlDrawRoom={createSketchRoom} />,
                            label: t('Create new draw'),
                        },
                    ]}
                />
                {!serviceSpaceId ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        <ServiceTable>
                            <ServiceTable.Body>
                                {spacedeckChildren?.map((tldrawSketchRoomId) => {
                                    const room = matrix.rooms.get(tldrawSketchRoomId);
                                    if (!room) return null;

                                    return (
                                        <ServiceLink
                                            key={tldrawSketchRoomId}
                                            name={room.name}
                                            href={`${tldrawPath}/${tldrawSketchRoomId}`}
                                            selected={roomId === tldrawSketchRoomId}
                                            ref={tldrawSketchRoomId === roomId ? selectedDrawRef : null}
                                        />
                                    );
                                })}
                            </ServiceTable.Body>
                        </ServiceTable>
                    </>
                )}
            </DefaultLayout.Sidebar>
            {roomId && matrix.rooms.get(roomId) && (
                <DefaultLayout.IframeWrapper>
                    <DefaultLayout.IframeHeader>
                        <h2>{matrix.rooms.get(roomId).name}</h2>
                        <DefaultLayout.IframeHeaderButtonWrapper>
                            <InviteUserToMatrixRoom
                                roomId={roomId}
                                trigger={
                                    <TextButton title={t('Invite users to {{name}}', { name: matrix.rooms.get(roomId).name })}>
                                        <Icon>
                                            <RiUserAddLine />
                                        </Icon>
                                    </TextButton>
                                }
                            />
                            <CopyToClipboard title={t('Copy sketch link to clipboard')} content={tldrawPath + '/' + roomId} />
                        </DefaultLayout.IframeHeaderButtonWrapper>
                    </DefaultLayout.IframeHeader>
                    <div className="h-full w-full">
                        <TldrawEditor onMount={setEditor} key={roomId}>
                            {/* Debugging */}
                            {process.env.NODE_ENV !== 'production' && (
                                <div style={{ position: 'absolute', zIndex: 300, top: 64, left: 12 }}>
                                    <pre style={{ margin: '0 0 16px 0' }}>
                                        {selectedShapeMeta
                                            ? JSON.stringify(selectedShapeMeta, null, '\t')
                                            : 'Select one shape to see its meta data.'}
                                    </pre>
                                </div>
                            )}
                        </TldrawEditor>
                    </div>
                </DefaultLayout.IframeWrapper>
            )}
        </>
    );
}
