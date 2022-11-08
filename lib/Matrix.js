/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { mapValues } from 'lodash';

function useMatrixProvider(activeMatrixAuthenticationProviders) {
    return mapValues(activeMatrixAuthenticationProviders, (authenticationProvider, type) => ((matrixClient) => {
        const [rooms, setRooms] = useState(new Map());
        const [invites, setInvites] = useState(new Map());
        const [directMessages, setDirectMessages] = useState(new Map());

        const buildRoomObject = useCallback((roomId) => {
            const room = matrixClient.getRoom(roomId);
            if (!room) return;

            let avatar;
            if (room.getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop')) {
                avatar = room.getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop');
            } else if (room.getAvatarFallbackMember() && room.getAvatarFallbackMember().getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop')) {
                avatar = room.getAvatarFallbackMember().getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop');
            }

            return {
                roomId: roomId,
                name: room.name,
                notificationCount: room.getUnreadNotificationCount(),
                events: new Map(room.currentState.events),
                avatar,
            };
        });

        const setRoom = (roomId) => {
            return (prevState) => {
                const newState = new Map(prevState);
                if (buildRoomObject(roomId)) {
                    newState.set(roomId, buildRoomObject(roomId));
                } else {
                    newState.delete(roomId);
                }
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
            if (room.isSpaceRoom()) return;

            if ((membership === 'leave' || membership === 'kick' || membership === 'ban')) {
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
                setRooms(setRoom(room.roomId));
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
            } else {
                setRooms(setRoom(room.roomId));
            }
        });

        const RoomReceiptEvent = useCallback((event, room) => {
            if (room.getType() !== 'm.receipt') return;
            if (room.getMyMembership() !== 'join') return;

            if (directMessages.has(room.roomId)) {
                setDirectMessages(setRoom(room.roomId));
            } else {
                setRooms(setRoom(room.roomId));
            }
        });

        const SyncEvent = useCallback((newState, prevState) => {
            if (newState === 'SYNCING' && prevState === 'PREPARED') {
                (async () => {
                    const mDirectEventContent = await matrixClient.getAccountDataFromServer('m.direct');
                    hydrateDirectMessages(mDirectEventContent);
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
        }, []);

        return {
            rooms,
            invites,
            directMessages,
        };
    })(authenticationProvider.getMatrixClient()));
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
