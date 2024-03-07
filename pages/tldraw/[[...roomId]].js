import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import _, { set } from 'lodash';
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
import { TldrawMatrixProvider } from '../draw/tldrawMatrix';
import CreateNewTldraw from './actions/CreateNewTldraw';
import CopyToClipboard from '@/components/UI/CopyToClipboard';
import { InviteUserToMatrixRoom } from '@/components/UI/InviteUsersToMatrixRoom';
import TextButton from '@/components/UI/TextButton';
import Icon from '@/components/UI/Icon';

const Editor = dynamic(() => import('../draw/editor'), { ssr: false });

export default function Tldraw(callback, deps) {
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const { t } = useTranslation('tldraw');
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');
    const serviceSpaceId = matrix.serviceSpaces.tldraw;
    const spacedeckChildren = matrix.spaces.get(serviceSpaceId)?.children?.filter((child) => child !== 'undefined'); // Filter out any undefined values to ensure 'spacedeckChildren' only contains valid objects

    // const tldrawMatrix = TldrawMatrixProvider(roomId);

    const [store, setStore] = useImmer({});
    const [initialSyncDone, setInitialSyncDone] = useState(false);

    /**
     * @type {MatrixClient}
     */
    const roomSpecificMatrixClient = useMemo(() => {
        if (!roomId) return;

        console.error('fnwbr Create new matrixclient');

        return createMatrixClient({
            baseUrl: matrixClient.getHomeserverUrl(),
            accessToken: matrixClient.getAccessToken(),
            userId: matrixClient.getUserId(),
            useAuthorizationHeader: true,
            timelineSupport: true,
            // Hide all of the matrix-js-sdk logging output
            logger: pino({ level: 'error' }),
        });
    }, [roomId]);

    // Whenever the roomId changes (e.g. after a new item was created), automatically focus that element.
    // This makes the sidebar scroll to the element if it is outside of the current viewport.
    const selectedDrawRef = useRef(null);
    useEffect(() => {
        setStore({});
        setInitialSyncDone(false);
        selectedDrawRef.current?.focus();
    }, [roomId]);

    useEffect(() => {
        const letsgo = async () => {
            if (!roomSpecificMatrixClient) return;

            console.warn('fnwbr Initial population of store, async!');

            const stateStoreSchema = await roomSpecificMatrixClient.getStateEvent(roomId, 'dev.medienhaus.tldraw.store.schema', '');
            const stateStoreStore = await roomSpecificMatrixClient.getStateEvent(roomId, 'dev.medienhaus.tldraw.store.store', '');
            setStore((draft) => ({
                schema: stateStoreSchema,
                store: stateStoreStore,
            }));

            console.warn('fnwbr Creating filters and attaching event listeners...');

            roomSpecificMatrixClient.on(RoomEvent.Timeline, RoomTimelineEvent);
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

            console.warn('fnwbr NOW STARTING CLIENT');

            roomSpecificMatrixClient.startClient({
                lazyLoadMembers: true,
                threadSupport: true,
            });
        };

        letsgo();

        return () => {
            console.error('fnwbr stopping old client for roomId', roomId);
            roomSpecificMatrixClient.off(ClientEvent.Sync, SyncEvent);
            roomSpecificMatrixClient.off(RoomEvent.Timeline, RoomTimelineEvent);
            roomSpecificMatrixClient.stopClient();
        };
    }, [roomId, roomSpecificMatrixClient]);

    useEffect(() => {
        const getAllEvents = async () => {
            if (!initialSyncDone) return;

            console.warn('fnwbr matrix-client INITIAL SYNC DONE');

            console.log('fnwbr', roomSpecificMatrixClient.getRoom(roomId).getUnfilteredTimelineSet());

            const x = new TimelineWindow(roomSpecificMatrixClient, roomSpecificMatrixClient.getRoom(roomId).getUnfilteredTimelineSet());
            x.load();

            console.log('fnwbr', x);
            console.log('fnwbr can paginate?', x.canPaginate(EventTimeline.BACKWARDS));
            console.log('fnwbr paginate', await x.paginate(EventTimeline.BACKWARDS, 1000));
            console.log('fnwbr', x);
            console.log('fnwbr can paginate?', x.canPaginate(EventTimeline.BACKWARDS));
            console.log('fnwbr paginate', await x.paginate(EventTimeline.BACKWARDS, 1000));
            console.log('fnwbr', x);
            console.log('fnwbr can paginate?', x.canPaginate(EventTimeline.BACKWARDS));
            console.warn('fnwbr STORE', store);
        };

        getAllEvents();
    }, [initialSyncDone]);

    const SyncEvent = useCallback(
        (newState, prevState) => {
            if (newState === 'SYNCING' && prevState === 'PREPARED') {
                (() => {
                    setInitialSyncDone(true);
                })();
            }
        },
        [setInitialSyncDone],
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

            console.log('fnwbr', event);

            if (event.event.type === 'm.room.message' && event.event.content.msgtype === 'dev.medienhaus.tldraw.store.store') {
                const content = JSON.parse(event.event.content.body);
                if (!content) return;
                const newStoreEntry = {
                    [Object.keys(content)[0]]: { ...content[Object.keys(content)[0]], ...{ meta: { eventId: event.event.event_id } } },
                };

                setStore((draft) => {
                    set(draft, `store.${Object.keys(content)[0]}`, newStoreEntry[Object.keys(newStoreEntry)[0]]);
                });
            } else if (event.event.type === 'm.room.redaction') {
                if (event.event.redacts) {
                    setStore((draft) => {
                        const storeElement = _.find(draft, (s) => s.meta.eventId === event.event.redacts);

                        set(draft, `store.${storeElement.id}`, undefined);
                    });
                }
            }
        },
        [roomId, setStore],
    );

    // based on the createWriteRoom in etherpad. there was a @TODO mentioned with 'function creates infinite loop in useEffect below' dont know if this applies here as well.
    const createSketchRoom = useCallback(
        async (name) => {
            if (!name) return;

            const newRoom = await matrix.createRoom(name, false, '', 'invite', 'content', 'tldraw', serviceSpaceId);

            // we add the defualt store schama data and the store data as an custom stateevent to the newly created room
            await matrixClient.sendStateEvent(
                newRoom,
                'dev.medienhaus.tldraw.store.schema',
                JSON.stringify({
                    schemaVersion: 1,
                    storeVersion: 4,
                    recordVersions: {
                        asset: { version: 1, subTypeKey: 'type', subTypeVersions: { image: 2, video: 2, bookmark: 0 } },
                        camera: { version: 1 },
                        document: { version: 2 },
                        instance: { version: 22 },
                        instance_page_state: { version: 5 },
                        page: { version: 1 },
                        shape: {
                            version: 3,
                            subTypeKey: 'type',
                            subTypeVersions: {
                                group: 0,
                                text: 1,
                                bookmark: 1,
                                draw: 1,
                                geo: 7,
                                note: 4,
                                line: 1,
                                frame: 0,
                                arrow: 2,
                                highlight: 0,
                                embed: 4,
                                image: 2,
                                video: 1,
                            },
                        },
                        instance_presence: { version: 5 },
                        pointer: { version: 1 },
                    },
                }),
            );
            await matrixClient.sendStateEvent(
                newRoom,
                'dev.medienhaus.tldraw.store.store',
                JSON.stringify({
                    'document:document': { gridSize: 10, name: '', meta: {}, id: 'document:document', typeName: 'document' },
                    'page:page': { meta: {}, id: 'page:page', name: 'Page 1', index: 'a1', typeName: 'page' },
                }),
            );

            await auth.getAuthenticationProvider('matrix').addSpaceChild(matrix.serviceSpaces.tldraw, newRoom);

            return newRoom;
        },
        [matrix, auth, serviceSpaceId, matrixClient],
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
            {roomId && (
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
                    {store && (
                        <Editor
                            store={store}
                            // updateStoreElement={tldrawMatrix.updateStoreElementInMatrix}
                            // addStoreElement={tldrawMatrix.addStoreElementToMatrix}
                            // deleteStoreElement={tldrawMatrix.deleteStoreElementInMatrix}
                        />
                    )}
                </DefaultLayout.IframeWrapper>
            )}
        </>
    );
}
