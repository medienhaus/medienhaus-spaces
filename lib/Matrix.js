import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import getConfig from 'next/config';
import _ from 'lodash';
import { useImmer } from 'use-immer';
import { ClientEvent, EventTimeline, EventType, RoomEvent } from 'matrix-js-sdk';

import logger from './Logging';

function useMatrixProvider(auth) {
    const authenticationProvider = auth.getAuthenticationProvider('matrix');
    const matrixClient = authenticationProvider.getMatrixClient();

    const [rooms, setRooms] = useImmer(new Map());
    const [spaces, setSpaces] = useImmer(new Map());
    const [invites, setInvites] = useImmer(new Set());
    const [knockingMembers, setKnockingMembers] = useImmer(new Map());
    const [directMessages, setDirectMessages] = useImmer(new Map());
    const [roomContents, setRoomContents] = useImmer(new Map());
    /**
     * A separate store only used for meta events.
     * You will probably want to use the "getMetaEvent()" function instead of accessing this map directly.
     *
     * @TODO: Update this store whenever we set a meta event somewhere.
     */
    const [metaEvents, setMetaEvents] = useImmer(new Map());

    const [isConnectedToServer, setIsConnectedToServer] = useState(true);
    const [initialSyncDone, setInitialSyncDone] = useState(false);

    const [applicationsFolder, setApplicationsFolder] = useState('');
    const [serviceSpaces, setServiceSpaces] = useImmer({});

    const buildRoomObject = useCallback(
        (roomId) => {
            const room = matrixClient.getRoom(roomId);

            if (!room) return;

            let avatar;

            if (room.getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop')) {
                avatar = room.getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop');
            } else if (
                room.getAvatarFallbackMember() &&
                room.getAvatarFallbackMember().getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop')
            ) {
                avatar = room.getAvatarFallbackMember().getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop');
            }

            const roomState = room.getLiveTimeline().getState(EventTimeline.FORWARDS);

            return {
                roomId,
                name: room.name,
                meta: roomState.getStateEvents('dev.medienhaus.meta', '')?.getContent(),
                children: roomState
                    .getStateEvents('m.space.child')
                    .map((event) => !_.isEmpty(event.getContent()) && event.getStateKey())
                    .filter((child) => child),
                notificationCount: room.getUnreadNotificationCount(),
                avatar,
            };
        },
        [matrixClient],
    );

    const setRoom = useCallback(
        (roomId) => {
            return (map) => {
                if (buildRoomObject(roomId)) {
                    map.set(roomId, buildRoomObject(roomId));
                } else {
                    map.delete(roomId);
                }
            };
        },
        [buildRoomObject],
    );

    const setMessages = useCallback(
        (roomId) => {
            const buildRoomContentObject = (roomId) => {
                // we check rooms for timeline events of the type 'm.room.message' and populate it with the last event, therefore the newest message
                const room = matrixClient.getRoom(roomId);
                if (!room) return;
                const messages = room.timeline.filter((timeline) => timeline.event.type === 'm.room.message');
                if (messages.length === 0) return;

                // we return the last array index. this coould also be replaced with the entire array if we need version control or undo functions in the future
                return messages[messages.length - 1].event.content;
            };

            return (map) => {
                map.set(roomId, buildRoomContentObject(roomId));
            };
        },
        [matrixClient],
    );

    const hydrateDirectMessages = useCallback(
        (mDirectEventContent) => {
            if (!mDirectEventContent) return;
            Object.values(mDirectEventContent).forEach((arrayOfDirectMessageRoomIds) => {
                arrayOfDirectMessageRoomIds.forEach((roomId) => {
                    setDirectMessages(setRoom(roomId));

                    if (rooms.has(roomId)) {
                        setRooms((map) => {
                            map.delete(roomId);
                        });
                    }
                });
            });
        },
        [rooms, setDirectMessages, setRoom, setRooms],
    );

    const RoomMyMembershipEvent = useCallback(
        /**
         * @param {Room} room
         * @param {string} membership
         * @param {string} [prevMembership] (might be undefined)
         */
        (room, membership, prevMembership) => {
            if (membership === 'leave' || membership === 'kick' || membership === 'ban') {
                if (spaces.has(room.roomId)) {
                    setSpaces((map) => {
                        map.delete(room.roomId);
                    });
                }

                if (rooms.has(room.roomId)) {
                    setRooms((map) => {
                        map.delete(room.roomId);
                    });
                    setRoomContents((map) => {
                        map.delete(room.roomId);
                    });
                }

                if (directMessages.has(room.roomId)) {
                    setDirectMessages((map) => {
                        map.delete(room.roomId);
                    });
                }
                //@TODO setRoomContents(setMessages(room.roomId));
            }

            if (membership === 'join' && !directMessages.has(room.roomId)) {
                if (room.isSpaceRoom()) {
                    setSpaces(setRoom(room.roomId));
                } else {
                    setRooms(setRoom(room.roomId));
                    setRoomContents(setMessages(room.roomId));
                }
            }

            // Add fresh invites to state
            if (membership === 'invite') {
                setInvites((set) => {
                    set.add(room.roomId);
                });
            }

            // Remove expired/accepted/rejected invites from state
            if (prevMembership === 'invite') {
                setInvites((set) => {
                    set.delete(room.roomId);
                });
            }
        },
        [directMessages, rooms, setDirectMessages, setInvites, setMessages, setRoom, setRoomContents, setRooms, setSpaces, spaces],
    );

    const assignAccessTokenToAuthProvider = useCallback(
        (eventContent) => {
            Object.entries(eventContent).forEach(([key, value]) => {
                if (auth.getAuthenticationProvider(key)) {
                    // we check if the given accessToken from the accountdata is an active authProvider of this current interface
                    auth.getAuthenticationProvider(key).setToken(value);
                    auth.getAuthenticationProvider(key).validateToken(); // we check if this new accessToken is valid which updates the connection status accordingly
                }
            });
        },
        [auth],
    );

    const AccountDataEvent = useCallback(
        /** @param {MatrixEvent} event */ (event) => {
            switch (event.getType()) {
                case 'm.direct':
                    hydrateDirectMessages(event.getContent());
                    break;

                case 'dev.medienhaus.spaces.accesstokens':
                    if (Object.keys(event.getContent()).length > 0) {
                        assignAccessTokenToAuthProvider(event.getContent());
                    }

                    break;
                default:
                    return;
            }
        },
        [assignAccessTokenToAuthProvider, hydrateDirectMessages],
    );

    const RoomTimelineEvent = useCallback(
        /**
         * @param {MatrixEvent} event
         * @param {Room} room
         */
        (event, room) => {
            // If this is a timeline event for a room that we're not a member of, we want to ignore it
            if (room.getMyMembership() !== 'join') return;

            // Update our room-typical stores (rooms, spaces, directMessages)
            if (directMessages.has(room.roomId)) {
                setDirectMessages(setRoom(room.roomId));
            } else if (room.isSpaceRoom()) {
                setSpaces(setRoom(room.roomId));
            } else {
                setRooms(setRoom(room.roomId));
                setRoomContents(setMessages(room.roomId));
            }

            // Update our internal store for pending knocks if this timeline event contained info about a knock
            if (event.getType() === EventType.RoomMember) {
                setKnockingMembers((map) => {
                    if (
                        room.getMember(matrixClient.getUserId()).powerLevel >=
                            room
                                .getLiveTimeline()
                                .getState(EventTimeline.FORWARDS)
                                .getStateEvents(EventType.RoomPowerLevels, '')
                                ?.getContent()['invite'] &&
                        event.getContent().membership === 'knock'
                    ) {
                        // Looks like we got a new knock for a room that we can manage them for ...
                        map.set(`${room.roomId}|${event.target.userId}`, {
                            roomId: room.roomId,
                            name: room.name,
                            userId: event.target.userId,
                            reason: event.getContent()?.reason,
                        });
                    } else if (map.has(`${room.roomId}|${event.target.userId}`)) {
                        // Looks like some previously existing knock was handled (or retracted?) ...
                        map.delete(`${room.roomId}|${event.target.userId}`);
                    }
                });
            }
        },
        [directMessages, matrixClient, setDirectMessages, setKnockingMembers, setMessages, setRoom, setRoomContents, setRooms, setSpaces],
    );

    const RoomReceiptEvent = useCallback(
        /**
         * @param {MatrixEvent} event
         * @param {Room} room
         */
        (event, room) => {
            if (event.getType() !== 'm.receipt') return;
            if (room.getMyMembership() !== 'join') return;

            if (directMessages.has(room.roomId)) {
                setDirectMessages(setRoom(room.roomId));
            } else {
                setRooms(setRoom(room.roomId));
                setRoomContents(setMessages(room.roomId));
            }
        },
        [directMessages, setDirectMessages, setMessages, setRoom, setRoomContents, setRooms],
    );

    const initializePendingKnocks = useCallback(() => {
        matrixClient.getRooms().forEach((room) => {
            // If this is a room we're not part of then we do not care about pending knocks; return early
            if (room.getMyMembership() !== 'join') return;
            // If this is a room we don't have sufficient power levels to invite new people to, we also don't care about knocks
            if (
                room.getMember(matrixClient.getUserId()).powerLevel <
                room.getLiveTimeline().getState(EventTimeline.FORWARDS).getStateEvents(EventType.RoomPowerLevels, '')?.getContent()[
                    'invite'
                ]
            )
                return;
            // Before we update the state let's make sure there are actually pending knocks there; otherwise return early
            if (room.getMembersWithMembership('knock').length < 1) return;

            room.getMembersWithMembership('knock').forEach((roomMember) => {
                setKnockingMembers((map) => {
                    map.set(`${room.roomId}|${roomMember.userId}`, {
                        roomId: room.roomId,
                        name: room.name,
                        userId: roomMember.userId,
                        reason: roomMember.events.member?.getContent()?.reason,
                    });
                });
            });
        });
    }, [matrixClient, setKnockingMembers]);

    const SyncEvent = useCallback(
        /**
         * @param {string} newState One of "ERROR", "PREPARED", "STOPPED", "SYNCING", "CATCHUP" or "RECONNECTING"
         * @param {string|null} prevState
         */
        (newState, prevState) => {
            if (newState === 'SYNCING') setIsConnectedToServer(true); // if there is a connection to the server we set our state to true

            if (newState === 'SYNCING' && prevState === 'PREPARED') {
                (async () => {
                    const mDirectEventContent = await matrixClient.getAccountDataFromServer('m.direct');
                    hydrateDirectMessages(mDirectEventContent);
                    initializePendingKnocks();
                    setInitialSyncDone(true);
                })();
            }

            if (newState === 'ERROR') {
                // if we've lost connection to the server we set our state to false
                setIsConnectedToServer(false);
            }
        },
        [hydrateDirectMessages, initializePendingKnocks, matrixClient],
    );

    useEffect(() => {
        matrixClient.on(ClientEvent.AccountData, AccountDataEvent);
        matrixClient.on(RoomEvent.MyMembership, RoomMyMembershipEvent);
        matrixClient.on(RoomEvent.Timeline, RoomTimelineEvent);
        matrixClient.on(RoomEvent.Receipt, RoomReceiptEvent);
        matrixClient.on(ClientEvent.Sync, SyncEvent);

        return () => {
            matrixClient.off(ClientEvent.AccountData, AccountDataEvent);
            matrixClient.off(RoomEvent.MyMembership, RoomMyMembershipEvent);
            matrixClient.off(RoomEvent.Timeline, RoomTimelineEvent);
            matrixClient.off(RoomEvent.Receipt, RoomReceiptEvent);
            matrixClient.off(ClientEvent.Sync, SyncEvent);
        };
    }, [AccountDataEvent, RoomMyMembershipEvent, RoomReceiptEvent, RoomTimelineEvent, SyncEvent, matrixClient]);

    const createRoom = useCallback(
        async (name, isSpace, topic, joinRule, type, template, parentId) => {
            const room = await authenticationProvider.createRoom(name, isSpace, topic, joinRule, type, template, parentId);

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
        },
        [authenticationProvider, rooms, setRoom, setRooms, setSpaces, spaces],
    );

    useEffect(() => {
        let cancelled = false;

        const lookForApplicationsFolder = _.debounce(async () => {
            if (cancelled) return;

            const spacesToScan = Array.from(spaces.values());
            const existingApplicationsSpace = spacesToScan.find((space) => space.meta?.template === 'applications');
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
                    'applications',
                );
                logger.debug('Created new "Applications" space', { newApplicationsSpace });
                setApplicationsFolder(newApplicationsSpace);
            }
        }, 250);

        initialSyncDone && !applicationsFolder && lookForApplicationsFolder();

        return () => {
            cancelled = true;
        };
    }, [applicationsFolder, createRoom, initialSyncDone, spaces]);

    useEffect(() => {
        let cancelled = false;

        const lookForServiceSpaces = _.debounce(async () => {
            if (cancelled) return;
            if (!spaces.get(applicationsFolder)) return;

            const applicationsChildren = spaces
                .get(applicationsFolder)
                .children // Retrieve the 'children' property of the 'applicationsFolder' object
                .map((child) => spaces.get(child)) // Map over the 'children' array and fetch the corresponding objects from the 'spaces' map
                .filter((child) => child !== undefined); // Filter out any undefined values to ensure 'applicationsChildren' only contains valid objects

            for (const element of Object.keys(getConfig().publicRuntimeConfig.authProviders)) {
                if (element === 'matrix') continue; // we don't want to create a service folder for matrix

                const existingServiceSpace = applicationsChildren.find((space) => space.name === element);

                if (existingServiceSpace) {
                    logger.debug('Found existing service space', { serviceType: element, existingServiceSpace });
                    setServiceSpaces((object) => {
                        object[element] = existingServiceSpace.roomId;
                    });
                } else {
                    logger.debug('Creating new service space...', { serviceType: element });
                    const roomId = await createRoom(
                        element,
                        true,
                        `This is your private space for the application ${element}. You can find all your ${element} data in here.`,
                        'invite',
                        'context',
                        'application',
                        applicationsFolder,
                    );
                    logger.debug('Created new service space', { serviceType: element, roomId });
                    await authenticationProvider.addSpaceChild(applicationsFolder, roomId);
                    setServiceSpaces((object) => {
                        object[element] = roomId;
                    });
                }
            }
        }, 500);

        applicationsFolder && _.isEmpty(serviceSpaces) && lookForServiceSpaces();

        return () => {
            cancelled = true;
        };
    }, [applicationsFolder, authenticationProvider, createRoom, serviceSpaces, setServiceSpaces, spaces]);

    const leaveRoom = async (roomId) => {
        return matrixClient.leave(roomId);
    };

    /**
     * This function is used when roomContents is empty because the returned timeline for a room is full of events other than m.room.message.
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
        // we set message to null. Otherwise, we populate it with the latest message.
        const message = _.isEmpty(fetchMessages.chunk) ? null : fetchMessages.chunk[0].content;
        setRoomContents((prevState) => {
            const newState = new Map(prevState);
            newState.set(roomId, message);

            return newState;
        });
    };

    /**
     * @param {string} roomId
     * @returns {Promise<unknown>|Object|undefined}
     */
    const getMetaEvent = async (roomId) => {
        // If for some reason this function was called without a valid roomId we just cancel right away
        if (!roomId) return;
        // And if we already have the metaEvent of the given room we also cancel right away
        if (metaEvents.has(roomId)) return metaEvents.get(roomId);

        const metaEvent = await authenticationProvider.fetchMetaEvent(roomId).catch(() => {});

        setMetaEvents((map) => map.set(roomId, metaEvent));

        return metaEvent;
    };

    return {
        rooms,
        spaces,
        invites,
        knockingMembers,
        directMessages,
        initialSyncDone,
        roomContents,
        applicationsFolder,
        serviceSpaces,
        leaveRoom,
        createRoom,
        hydrateRoomContent,
        getMetaEvent,
        isConnectedToServer,
    };
}

const MatrixContext = createContext(undefined);

function useMatrix() {
    return useContext(MatrixContext);
}

export { MatrixContext, useMatrixProvider, useMatrix };
