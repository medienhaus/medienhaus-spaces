/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import getConfig from 'next/config';

import logger from './Logging';

function useMatrixProvider(auth) {
    const authenticationProvider = auth.getAuthenticationProvider('matrix');
    const matrixClient = authenticationProvider.getMatrixClient();

    const [rooms, setRooms] = useState(new Map());
    const [spaces, setSpaces] = useState(new Map());
    const [invites, setInvites] = useState(new Map());
    const [directMessages, setDirectMessages] = useState(new Map());
    const [roomContents, setRoomContents] = useState(new Map());
    const [initialSyncDone, setInitialSyncDone] = useState(false);
    const [applicationsFolder, setApplicationsFolder] = useState('');
    const [serviceSpaces, setServiceSpaces] = useState({});
    const [isConnectedToServer, setIsConnectedToServer] = useState(true);

    const buildRoomObject = useCallback((roomId) => {
        const room = matrixClient.getRoom(roomId);
        if (!room) return;

        let avatar;
        if (room.getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop')) {
            avatar = room.getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop');
        } else if (room.getAvatarFallbackMember() && room.getAvatarFallbackMember().getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop')) {
            avatar = room.getAvatarFallbackMember().getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop');
        }

        let medienhausMetaEvent;
        if (room.currentState.events.has('dev.medienhaus.meta')) {
            medienhausMetaEvent = room.currentState.events.get('dev.medienhaus.meta').values().next().value.event.content;
        }

        // we check to see if a room has space children and if so add those to our object.
        const children = [];
        if (room.currentState.events.has('m.space.child')) {
            for (const child of room.currentState.events.get('m.space.child').values()) {
                if (_.isEmpty(child.event.content)) continue;
                children.push(child.event.state_key);
            }
        }

        return {
            roomId: roomId,
            name: room.name,
            meta: medienhausMetaEvent,
            children: children,
            notificationCount: room.getUnreadNotificationCount(),
            events: room.currentState.events,
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

    const deleteElement = (roomId) => {
        return (prevState) => {
            const newState = new Map(prevState);
            newState.delete(roomId);

            return newState;
        };
    };

    const setMessages = (roomId) => {
        const buildRoomContentObject = (roomId) => {
            // we check rooms for timeline events of the type 'm.room.message' and populate it with the last event, therefore the newest message
            const room = matrixClient.getRoom(roomId);
            if (!room) return;
            const messages = room.timeline.filter(timeline => timeline.event.type === 'm.room.message');
            if (messages.length === 0) return;

            // we return the last array index. this coould also be replaced with the entire array if we need version control or undo functions in the future
            return messages[messages.length-1].event.content;
        };

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
                    setRooms(deleteElement(roomId));
                }
            });
        });
    }, [buildRoomObject, rooms]);

    const RoomMyMembershipEvent = useCallback((room, membership, prevMembership) => {
        if ((membership === 'leave' || membership === 'kick' || membership === 'ban')) {
            if (spaces.has(room.roomId)) {
                setSpaces(deleteElement(room.roomId));
            }
            if (rooms.has(room.roomId)) {
                setRooms(deleteElement(room.roomId));
                setRoomContents(deleteElement(room.roomId));
            }
            if (invites.has(room.roomId)) {
                setInvites(deleteElement(room.roomId));
            }
            if (directMessages.has(room.roomId)) {
                setDirectMessages(deleteElement(room.roomId));
            }
            //@TODO setRoomContents(setMessages(room.roomId));
        }
        if ((membership === 'join') && !directMessages.has(room.roomId)) {
            if (room.isSpaceRoom()) {
                setSpaces(setRoom(room.roomId));
            } else {
                setRooms(setRoom(room.roomId));
                setRoomContents(setMessages(room.roomId));
            }

            if (invites.has(room.roomId)) {
                setInvites(deleteElement(room.roomId));
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
            setRoomContents(setMessages(room.roomId));
        }
    });

    const RoomReceiptEvent = useCallback((event, room) => {
        if (room.getType() !== 'm.receipt') return;
        if (room.getMyMembership() !== 'join') return;

        if (directMessages.has(room.roomId)) {
            setDirectMessages(setRoom(room.roomId));
        } else {
            setRooms(setRoom(room.roomId));
            setRoomContents(setMessages(room.roomId));
        }
    });

    const SyncEvent = useCallback((newState, prevState) => {
        if (newState === 'SYNCING') setIsConnectedToServer(true); // if there is a connection to the server we set our state to true
        if (newState === 'SYNCING' && prevState === 'PREPARED') {
            (async () => {
                const mDirectEventContent = await matrixClient.getAccountDataFromServer('m.direct');
                hydrateDirectMessages(mDirectEventContent);
                setInitialSyncDone(true);
            })();
        }
        if (newState === 'ERROR') {
            // if we've lost connection to the server we set our state to false
            setIsConnectedToServer(false);
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

    useEffect(() => {
        const lookForApplicationsFolder = async () => {
            const spacesToScan = Array.from(spaces.values());
            const existingApplicationsSpace = spacesToScan.find(space => space.meta?.template === 'applications');
            logger.debug('Trying to find "Applications" space...', { spacesToScan });

            if (existingApplicationsSpace) {
                logger.debug('Found "Applications" space', { existingApplicationsSpace });
                setApplicationsFolder(existingApplicationsSpace.roomId);
            } else {
                logger.debug('Creating new root "Applications" space...');
                const newApplicationsSpace = await createRoom(
                    'Applications',
                    true,
                    'This is your private applications space. You can find all your application data in here.',
                    'invite',
                    'context',
                    'applications');
                logger.debug('Created new "Applications" space', { newApplicationsSpace });
                setApplicationsFolder(newApplicationsSpace);
            }
        };

        initialSyncDone && lookForApplicationsFolder();
    }, [initialSyncDone]);

    useEffect(() => {
        const lookForServiceSpaces = async () => {
            // @TODO We do not actually ensure that the service spaces we search for are a child space of the
            // "Applications" space we found previously. I assume we want to ensure that though.
            const serviceSpaces = {};
            for (const element of Object.keys(getConfig().publicRuntimeConfig.authProviders)) {
                if (element === 'matrix') continue; // we don't want to create a service folder for matrix

                const existingServiceSpace = Array.from(spaces.values()).find(space => space.name === element);
                if (existingServiceSpace) {
                    logger.debug('Found existing service space', { serviceType: element, existingServiceSpace });
                    serviceSpaces[element] = existingServiceSpace.roomId;
                } else {
                    logger.debug('Creating new service space...', { serviceType: element });
                    const roomId = await createRoom(
                        element,
                        true,
                        `This is your private space for the application ${element}. You can find all your ${element} data in here.`,
                        'invite',
                        'context',
                        'application');
                    logger.debug('Created new service space...', { serviceType: element, roomId });
                    await authenticationProvider.addSpaceChild(applicationsFolder, roomId);
                    serviceSpaces[element] = roomId;
                }
            }

            setServiceSpaces(serviceSpaces);
        };

        applicationsFolder && lookForServiceSpaces();
    }, [applicationsFolder]);

    const leaveRoom = async (roomId) => {
        const leaveMatrixRoom = await matrixClient.leave(roomId);
        leaveMatrixRoom.event_id && deleteElement(roomId);
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

    /**
         * This function is used when roomContents is empty because the returned timeline for a room is full with events other than m.room.message.
         * If there is no m.room.message event in the timeline we use this method to manually get the very last message of the given room.
         *
         * @param {string} roomId
         * @param {AbortSignal} abortSignal
         * @returns {Promise}
         */
    const hydrateRoomContent = async (roomId, abortSignal) => {
        // If for some reason this function was called without a valid roomId we just cancel right away
        if (!roomId) return;
        // And if we already know the room contents of the given room we also cancel right away
        if (roomContents.get(roomId) !== undefined) return;

        const fetchMessages = await authenticationProvider.fetchRoomMessages(roomId, 1, abortSignal);
        // If there are no messages in the room and therefore fetchMessages.chunk is empty,
        // we set message to null. Otherwise we populate it with the latest message.
        const message = _.isEmpty(fetchMessages.chunk) ? null : fetchMessages.chunk[0].content;
        setRoomContents((prevState) => {
            const newState = new Map(prevState);
            newState.set(roomId, message);

            return newState;
        });

        return message;
    };

    const roomHierarchy = async (roomId, limit, maxDepth, suggestedOnly) => {
        const rooms = [];

        const fetchHierarchyFromMatrix = async (fromToken) => {
            const hierarchy = await matrixClient.getRoomHierarchy(roomId, limit, maxDepth, suggestedOnly, fromToken);
            rooms.push(...hierarchy.rooms);
            if (hierarchy.next_batch) await fetchHierarchyFromMatrix(hierarchy.next_batch);

            return rooms;
        };
        await fetchHierarchyFromMatrix();

        return rooms;
    };

    const hydrateMetaEvent = async (roomId) => {
        // If for some reason this function was called without a valid roomId we just cancel right away
        if (!roomId) return;
        // And if we already have the metaEvent of the given room we also cancel right away
        if (rooms.get(roomId)?.meta || spaces.get(roomId)?.meta || invites.get(roomId)?.meta) return;

        const fetchMetaEvent = await authenticationProvider.fetchMetaEvent(roomId, 1);

        return fetchMetaEvent;
    };

    return {
        rooms,
        spaces,
        invites,
        directMessages,
        initialSyncDone,
        roomContents,
        applicationsFolder,
        serviceSpaces,
        leaveRoom,
        createRoom,
        hydrateRoomContent,
        roomHierarchy,
        hydrateMetaEvent,
        isConnectedToServer,
    };
}

const MatrixContext = createContext(undefined);

function useMatrix() {
    return useContext(MatrixContext);
}

export {
    MatrixContext,
    useMatrixProvider,
    useMatrix,
};
