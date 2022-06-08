/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isEmpty, mapValues } from 'lodash';

function useMatrixProvider(activeMatrixAuthenticationProviders) {
    return mapValues(activeMatrixAuthenticationProviders, (authenticationProvider, type) => ((authenticationProvider) => {
        const matrixClient = authenticationProvider.getMatrixClient();
        const [rooms, setRooms] = useState(new Map());
        const [spaces, setSpaces] = useState(new Map());
        const [invites, setInvites] = useState(new Map());
        const [directMessages, setDirectMessages] = useState(new Map());
        const [roomContent, setRoomContent] = useState(new Map());
        const [initialSyncDone, setInitialSyncDone] = useState(false);

        const buildRoomObject = useCallback((roomId) => {
            const room = matrixClient.getRoom(roomId);
            if (!room) return { roomId };
            const children = [];
            let medienhausMetaEvent;
            if (room.currentState.events.has('dev.medienhaus.meta')) {
                medienhausMetaEvent = room.currentState.events.get('dev.medienhaus.meta').values().next().value.event.content;
            }
            if (room.currentState.events.has('m.space.child')) {
                // we check to see if a room has space children and if so add those to our object.
                for (const child of room.currentState.events.get('m.space.child').values()) {
                    if (isEmpty(child.event.content)) continue;
                    children.push(child.event.state_key);
                }
            }
            return {
                roomId: roomId,
                name: room.name,
                meta: medienhausMetaEvent,
                children: children,
                notificationCount: room.getUnreadNotificationCount(),
                events: new Map(room.currentState.events),
            };
        });

        const setRoom = (roomId) => {
            return (prevState) => {
                const newState = new Map(prevState);
                newState.set(roomId, buildRoomObject(roomId));
                return newState;
            };
        };

        const deleteRoom = (roomId) => {
            return (prevState) => {
                const newState = new Map(prevState);
                newState.delete(roomId);
                return newState;
            };
        };

        const buildRoomContentObject = (roomId) => {
            // we check rooms for timeline events of the type 'm.room.message' and populate it with the last event, therefore the newewst message
            const room = matrixClient.getRoom(roomId);
            if (!room) return;
            const messages = room.timeline.filter(timeline => timeline.event.type === 'm.room.message');
            if (messages.length === 0) return;
            // we return the last array index. this coould also be replaced with the entire array if we need version control or undo functions in the future
            return messages[messages.length-1].event.content;
        };

        const setMessages = (roomId) => {
            return (prevState) => {
                const newState = new Map(prevState);
                newState.set(roomId, buildRoomContentObject(roomId));
                return newState;
            };
        };

        const hydrateDirectMessages = useCallback((mDirectEventContent) => {
            if (!mDirectEventContent) return;
            Object.values(mDirectEventContent).forEach((arrayOfDirectMessageRoomIds) => {
                arrayOfDirectMessageRoomIds.forEach((roomId) => {
                    setDirectMessages(setRoom(roomId));
                    if (rooms.has(roomId)) {
                        setRooms(deleteRoom(roomId));
                    }
                });
            });
        }, [buildRoomObject, rooms]);

        const RoomMyMembershipEvent = useCallback((room, membership, prevMembership) => {
            if ((membership === 'leave' || membership === 'kick' || membership === 'ban')) {
                if (spaces.has(room.roomId)) {
                    setSpaces(deleteRoom(room.roomId));
                }
                if (rooms.has(room.roomId)) {
                    setRooms(deleteRoom(room.roomId));
                }
                if (invites.has(room.roomId)) {
                    setInvites(deleteRoom(room.roomId));
                }
                if (directMessages.has(room.roomId)) {
                    setDirectMessages(deleteRoom(room.roomId));
                }
            }
            if ((membership === 'join') && !directMessages.has(room.roomId)) {
                if (room.isSpaceRoom()) {
                    setSpaces(setRoom(room.roomId));
                } else {
                    setRooms(setRoom(room.roomId));
                    setRoomContent(setMessages(room.roomId));
                }

                if (invites.has(room.roomId)) {
                    setInvites(deleteRoom(room.roomId));
                }
            }
            if ((membership === 'invite')) {
                setInvites(setRoom(room.roomId));
            }
        });

        const AccountDataEvent = useCallback((event) => {
            if (event.getType() !== 'm.direct') return;
            hydrateDirectMessages(event.getContent());
        });

        const RoomTimelineEvent = useCallback((event, room) => {
            if (room.getMyMembership() !== 'join') return;
            if (directMessages.has(room.roomId)) {
                setDirectMessages(setRoom(room.roomId));
            } else if (room.isSpaceRoom()) {
                setSpaces(setRoom(room.roomId));
            } else {
                setRooms(setRoom(room.roomId));
                setRoomContent(setMessages(room.roomId));
            }
        });

        const RoomReceiptEvent = useCallback((event, room) => {
            if (room.getType() !== 'm.receipt') return;
            if (room.getMyMembership() !== 'join') return;

            if (directMessages.has(room.roomId)) {
                setDirectMessages(setRoom(room.roomId));
            } else {
                setRooms(setRoom(room.roomId));
                setRoomContent(setMessages(room.roomId));
            }
        });

        const SyncEvent = useCallback((newState, prevState) => {
            if (newState === 'SYNCING' && prevState === 'PREPARED') {
                (async () => {
                    const mDirectEventContent = await matrixClient.getAccountDataFromServer('m.direct');
                    hydrateDirectMessages(mDirectEventContent);
                    setInitialSyncDone(true);
                })();
            }
        });

        useEffect(() => {
            matrixClient.on('accountData', AccountDataEvent);
            matrixClient.on('Room.myMembership', RoomMyMembershipEvent);
            matrixClient.on('Room.timeline', RoomTimelineEvent);
            matrixClient.on('Room.receipt', RoomReceiptEvent);
            matrixClient.on('sync', SyncEvent);

            return () => {
                matrixClient.off('accountData', AccountDataEvent);
                matrixClient.off('Room.myMembership', RoomMyMembershipEvent);
                matrixClient.off('Room.timeline', RoomTimelineEvent);
                matrixClient.off('Room.receipt', RoomReceiptEvent);
                matrixClient.off('sync', SyncEvent);
            };
        });

        const leaveRoom = async (roomId) => {
            const leaveMatrixRoom = await matrixClient.leave(roomId);
            leaveMatrixRoom.event_id && deleteRoom(roomId);
        };

        const createRoom = async (name, isSpace, topic, joinRule, type, template, application) => {
            const room = await authenticationProvider.createRoom(name, isSpace, topic, joinRule, type, template, application);
            if (isSpace) {
                if (!spaces.has(room.room_id)) {
                    setSpaces(setRoom(room.room_id));
                }
            } else {
                if (!rooms.has(room.room_id)) {
                    setRooms(setRoom(room.room_id));
                }
            }
            return room.room_id;
        };

        const hydrateRoomContent = async (roomId) => {
            if (roomContent.get(roomId) !== undefined) return;
            // if there is no m.room.message event in the timeline we check manually for messages
            const fetchMessages = await authenticationProvider.fetchRoomMessages(roomId);
            // if there are no messages in the room and therefore fetchMessages.chunk is empty,
            // we set message to null instead of undefined. Otherwise we populate it with the latest message.
            const message = isEmpty(fetchMessages.chunk) ? null : fetchMessages.chunk[0].content;
            setRoomContent((prevState) => {
                const newState = new Map(prevState);
                newState.set(roomId, message);
                return newState;
            });
        };

        return {
            rooms,
            spaces,
            invites,
            directMessages,
            initialSyncDone,
            roomContent,
            leaveRoom,
            createRoom,
            hydrateRoomContent,
        };
    })(authenticationProvider));
}

const MatrixContext = createContext(undefined);

function useMatrix(authenticationProvider) {
    return useContext(MatrixContext)[authenticationProvider.configuration.type];
}

export {
    MatrixContext,
    useMatrixProvider,
    useMatrix,
};
