import { useCallback, useEffect, useState, useRef } from 'react';
import { useImmer } from 'use-immer';
import _, { set } from 'lodash';

import MatrixSpecificRoomsProvider from './MatrixSpecificRoomsProvider';

function TldrawMatrixProvider(roomId) {
    const [store, setStore] = useImmer(null);

    const [matrixRoomClient, setMatrixRoomClient] = useImmer(null);
    const [initialSyncDone, setInitialSyncDone] = useState(false);
    const initiallyPopulated = useRef(false);

    if (matrixRoomClient) matrixRoomClient.startClient();

    const SyncEvent = useCallback((newState, prevState) => {
        if (newState === 'SYNCING' && prevState === 'PREPARED') {
            (() => {
                setInitialSyncDone(true);
            })();
        }
    }, [setInitialSyncDone]);

    const RoomTimelineEvent = useCallback((event, room) => {
        if (event.event.type === 'm.room.message' && event.event.content.msgtype === 'dev.medienhaus.tldraw.store.store') {
            const content = JSON.parse(event.event.content.body);
            if (!content) return;
            const newStoreEntry = { [Object.keys(content)[0]]: { ...content[Object.keys(content)[0]], ...{ meta: { eventId: event.event.event_id } } } };

            setStore(draft => {
                set(draft, `store.${Object.keys(content)[0]}`, newStoreEntry[Object.keys(newStoreEntry)[0]]);
            });
        } else if (event.event.type === 'm.room.redaction') {
            const storeElement = _.find(store, s => s.meta.eventId === event.event.redacts);

            if (storeElement && event.event.redacts) {
                setStore(draft => {
                    set(draft, `store.${storeElement.id}`, undefined);
                });
            }
        }
    }, [matrixRoomClient, setStore]);

    useEffect(() => {
        if (!roomId) return;

        setStore(null);

        setMatrixRoomClient(new MatrixSpecificRoomsProvider(
            { baseUrl: window.localStorage.getItem('medienhaus_hs_url') },
            window.localStorage.getItem('mx_user_id'),
            window.localStorage.getItem('mx_access_token'),
            [roomId],
            [
                'dev.medienhaus.tldraw.store.store.shape',
                'dev.medienhaus.tldraw.store.store.page',
                'dev.medienhaus.tldraw.store.store.document',
                'dev.medienhaus.tldraw.store.schema',
                'dev.medienhaus.tldraw.store.store',
            ],
        ));
        setInitialSyncDone(false);
        initiallyPopulated.current = false;
    }, [roomId]);

    useEffect(() => {
        if (!matrixRoomClient) return;
        matrixRoomClient.getMatrixClient().on('Room.timeline', RoomTimelineEvent);
        matrixRoomClient.getMatrixClient().on('sync', SyncEvent);

        return () => {
            matrixRoomClient.getMatrixClient().off('Room.timeline', RoomTimelineEvent);
            matrixRoomClient.getMatrixClient().off('sync', SyncEvent);
        };
    }, [RoomTimelineEvent, matrixRoomClient, SyncEvent]);

    useEffect(() => {
        if (!initialSyncDone) return;

        const fetchStoreElementFromStateEvents = async () => {
            const tempStore = { };
            const stateStoreSchema = await matrixRoomClient.getMatrixClient().getStateEvent(roomId, 'dev.medienhaus.tldraw.store.schema', '');
            const stateStoreStore = await matrixRoomClient.getMatrixClient().getStateEvent(roomId, 'dev.medienhaus.tldraw.store.store', '');
            tempStore.schema = stateStoreSchema;
            tempStore.store = stateStoreStore;
            await fetchStoreFromTimelineEvents(tempStore);

            setStore(tempStore);
        };

        const fetchStoreFromTimelineEvents = async (tempStore) => {
            const room = matrixRoomClient.getMatrixClient().getRoom(roomId);
            if (!room) return;
            const events = room?.getLiveTimeline()?.getEvents();
            const allTimelineMessages = (await matrixRoomClient.fetchRoomMessages(roomId, 5000))?.chunk;

            allTimelineMessages.forEach(message => {
                // we check if the message is not deleted as a content exists as well as if the msgtype is the one we are searching for
                if (message?.content?.msgtype === 'dev.medienhaus.tldraw.store.store') {
                    // we check if this is already a thread or if this is the first message
                    const potentialLatestThreadMessage = message?.unsigned['m.relations']?.['m.thread'].latest_event?.content?.body;
                    const messageContent = potentialLatestThreadMessage ? potentialLatestThreadMessage : message.content.body;

                    // we check if the last person have deleted the content so this means this whole entry is seen as deleted as the last author maybe cant delete the entry event as it was created by someone else
                    if (message?.unsigned['m.relations']?.['m.thread'].latest_event && !messageContent) return;

                    //we check if the message is part of a thread and check if the initial message which started the thread is not redacted
                    if (message?.content['m.relates_to']?.event_id && !(allTimelineMessages.find(m => m.event_id === message.content['m.relates_to'].event_id)?.content?.msgtype)) return;

                    let content;

                    try {content = JSON.parse(messageContent);} catch (error) {return;}

                    // we add the first eventId to the entry to add to the store as we use this as an unique identifier for the itterations via threads in the matrix data
                    content[Object.keys(content)[0]].meta.eventId = message?.event_id;

                    // finally we check if the pasing went right and we will add it to the store
                    if (message?.event_id && content) {
                        tempStore.store[Object.keys(content)[0]] = content[Object.keys(content)[0]];
                    }
                }
            });
        };

        if (!initiallyPopulated.current) {
            initiallyPopulated.current = true;
            fetchStoreElementFromStateEvents();
        }
    }, [initialSyncDone, setStore, matrixRoomClient, roomId]);

    useEffect(() => {
        console.log('newStore:'+ Date.now(), store);
    }, [store],
    );

    const addStoreElementToMatrix = async (storeElementKey, storeElementContent, eventId) => {
        const newEventId = await matrixRoomClient.getMatrixClient().sendMessage(roomId, {
            msgtype: 'dev.medienhaus.tldraw.store.store',
            body: JSON.stringify({ [storeElementKey]: storeElementContent }),
        });

        if (newEventId.event_id) {
            const newStoreEntry = { [storeElementKey]: { ...storeElementContent, ...{ meta: { eventId: newEventId.event_id } } } };

            setStore(draft => {
                set(draft, `store.${storeElementKey}`, newStoreEntry[Object.keys(newStoreEntry)[0]]);
            });
        }
    };

    const updateStoreElementInMatrix = async (storeElementKey, storeElementContent, eventId) => {
        //we check if it is already an thread and get the latest eventId in this thread to respond to that one instead of the main event, as otherwise matrix would not accept the call
        const lastestEventIdInThread = await matrixRoomClient.fetchLatestEventIdFromThread(roomId, eventId);

        let newEventId;

        if (lastestEventIdInThread) {
            newEventId = await matrixRoomClient.getMatrixClient().sendMessage(roomId, {
                'msgtype': 'dev.medienhaus.tldraw.store.store',
                'body': JSON.stringify({ [storeElementKey]: storeElementContent }),
                'm.relates_to': {
                    'rel_type': 'm.thread',
                    'event_id': eventId,
                    'is_falling_back': true,
                    'm.in_reply_to': {
                        'event_id': lastestEventIdInThread,
                    },
                },
            });
        } else {
            newEventId = await matrixRoomClient.getMatrixClient().sendMessage(roomId, eventId, {
                msgtype: 'dev.medienhaus.tldraw.store.store',
                body: JSON.stringify({ [storeElementKey]: storeElementContent }),
            });
        }

        if (newEventId.event_id) {
            const newStoreEntry = { [storeElementKey]: storeElementContent };
            setStore(draft => {
                set(draft, `store.${storeElementKey}`, newStoreEntry[Object.keys(newStoreEntry)[0]]);
            });
        }
    };

    const deleteStoreElementInMatrix = async (storeElementKey, storeElementContent, eventId) => {
        await matrixRoomClient.getMatrixClient().redactEvent(roomId, eventId);

        //@todo redact also all other events in the thread and not only the root one
    };

    return {
        store,
        addStoreElementToMatrix,
        updateStoreElementInMatrix,
        deleteStoreElementInMatrix,
        matrixRoomClient,

    };
}

export {
    TldrawMatrixProvider,

};
