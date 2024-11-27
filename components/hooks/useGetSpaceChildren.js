import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import _ from 'lodash';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';

import logger from '@/lib/Logging';

export const useGetSpaceChildren = (auth, matrix, matrixClient, cachedSpace) => {
    const [selectedSpaceChildren, setSelectedSpaceChildren] = useState([]);
    const [isFetchingSpaceChildren, setIsFetchingSpaceChildren] = useState('');
    const [progress, setProgress] = useState(0);
    const { t } = useTranslation('explore');
    // Call API to fetch and add room hierarchy to selectedSpaceChildren
    const getSpaceChildren = useCallback(
        async (e, roomId) => {
            if (!selectedSpaceChildren) return;
            setIsFetchingSpaceChildren(roomId);
            e && e.preventDefault();
            logger.debug('Fetch the room hierarchy for ' + roomId);
            setProgress(10);

            const getHierarchyFromServer = async (roomId) => {
                const roomHierarchyFromServer = await matrix.roomHierarchy(roomId, null, 1).catch(async (error) => {
                    if (error.data?.error.includes('not in room')) {
                        // If the error indicates the user is not in the room and previews are disabled
                        // We prompt the user to join the room.
                        if (
                            confirm(
                                t('You are currently not in room {{roomId}}, and previews are disabled. Do you want to join the room?', {
                                    roomId: roomId,
                                }),
                            )
                        ) {
                            const joinRoom = await matrixClient.joinRoom(roomId).catch((error) => {
                                toast.error(error.message);
                            });

                            // If successfully joined, recursively call 'getSpaceHierarchy' again.
                            if (joinRoom) return await getHierarchyFromServer(roomId);
                        }
                    } else {
                        return matrix
                            .handleRateLimit(error, () => getHierarchyFromServer(roomId))
                            .catch((error) => {
                                // we don't want to display unnecessary error messages.
                                if (error.message === 'Event not found.') return;
                                if (error.message.includes('not in room')) return;
                                toast.error(error.message);
                            }); // Handle other errors by setting an error message.
                    }
                });
                if (!roomHierarchyFromServer) return;
                const parent = roomHierarchyFromServer[0];

                const getMetaEvent = async (obj) => {
                    logger.debug('Getting meta event for ' + (obj.state_key || obj.room_id));
                    const metaEvent = await auth
                        .getAuthenticationProvider('matrix')
                        .getMatrixClient()
                        .getStateEvent(obj.state_key || obj.room_id, 'dev.medienhaus.meta');

                    if (metaEvent) obj.meta = metaEvent;
                };

                for (const space of roomHierarchyFromServer) {
                    // update the progress bar for each space up to 90% depending on the amount of spaces
                    setProgress((prevState) => {
                        if (prevState < 90) return Math.ceil(prevState + 90 / roomHierarchyFromServer.length);

                        return prevState;
                    });

                    if (space.room_id !== roomHierarchyFromServer[0].room_id) {
                        space.parent = parent;
                    }

                    await getMetaEvent(space).catch((error) => {
                        logger.debug(error);

                        return matrix
                            .handleRateLimit(error, () => getMetaEvent(space))
                            .catch((error) => {
                                // we don't want to display unnecessary error messages.
                                if (error.message === 'Event not found.') return;
                                if (error.message.includes('not in room')) return;

                                toast.error(error.message);
                            });
                    });
                }

                return roomHierarchyFromServer;
            };

            // initialise the spaceHierarchy array which is either filled by our cache or the server
            let spaceHierarchy = [];

            // if a cached space exists, we can use it to get the children
            if (cachedSpace) {
                if (cachedSpace.children) {
                    for await (const roomId of cachedSpace.children) {
                        // update the progress bar for each space up to 90% depending on the amount of spaces
                        setProgress((prevState) => {
                            if (prevState < 90) return Math.ceil(prevState + 90 / cachedSpace.children.length);

                            return prevState;
                        });

                        const cachedChild = { ...(matrix.spaces.get(roomId) || matrix.rooms.get(roomId)) };

                        if (!_.isEmpty(cachedChild)) {
                            const copy = { ...cachedChild };
                            copy.parent = cachedSpace;
                            spaceHierarchy.push(copy);
                        } else {
                            const getChildFromServer = await getHierarchyFromServer(roomId);
                            if (!getChildFromServer) return;
                            getChildFromServer[0].parent = cachedSpace;
                            spaceHierarchy.push(getChildFromServer[0]);
                        }
                    }

                    // insert the cached space at the beginning of the array to mimic the behaviour of matrix.getRoomHierarchy
                    spaceHierarchy.splice(0, 0, cachedSpace);
                }
            } else {
                spaceHierarchy = await getHierarchyFromServer(roomId);
            }

            setSelectedSpaceChildren((prevState) => {
                // Check if the selected roomId is already inside the array
                let indexOfParent = null;

                for (const [index, children] of prevState.entries()) {
                    const childRoomId = children[0].room_id || children[0].roomId || children[0].id;

                    if (childRoomId === roomId) {
                        // If there is a match, return the position and exit the loop
                        indexOfParent = index;
                        break;
                    }
                }

                // If indexOfParent is 0 or the context root ID defined in the config, return the new spaceHierarchy
                if (indexOfParent === 0 || roomId === getConfig().publicRuntimeConfig.contextRootSpaceRoomId) return [spaceHierarchy];
                // Otherwise, delete all entries starting with the found index
                if (indexOfParent) prevState.splice(indexOfParent);

                // If indexOfParent is still null, simply add the new spaceHierarchy to the end of the array if it isn't undefined (this is an error I have run into when testing federation, I am not sure where it occurs above, so I am filtering here until I find the source of the error)
                if (!spaceHierarchy) return [...prevState];

                return [...prevState, spaceHierarchy];
            });
            setProgress(100);
            setIsFetchingSpaceChildren('');
            // actually give the progress bar some time to animate then reset
            _.delay(() => setProgress(0), 100);
        },
        [auth, matrix, matrixClient, selectedSpaceChildren, t, cachedSpace],
    );

    return { isFetchingSpaceChildren, progress, selectedSpaceChildren, getSpaceChildren };
};
