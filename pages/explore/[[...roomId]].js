import React, { useCallback, useEffect, useRef, useState } from 'react';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import _ from 'lodash';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { ServiceTable } from '../../components/UI/ServiceTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import ExploreMatrixActions from './manage-room/ExploreMatrixActions';
import ErrorMessage from '../../components/UI/ErrorMessage';
import TreeLeaves from './TreeLeaves';
import TreePath from './TreePath';
import ExploreIframeViews from './ExploreIframeViews';
import logger from '../../lib/Logging';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import DefaultLayout from '../../components/layouts/default';

const ServiceTableWrapper = styled.div`
  width: 100%;
  overflow: auto;
`;

/**
 * Explore component for managing room hierarchies and content.
 *
 * @component
 * @returns {JSX.Element} The rendered Explore component.
 */
export default function Explore() {
    const [selectedSpaceChildren, setSelectedSpaceChildren] = useState([]);
    const [manageContextActionToggle, setManageContextActionToggle] = useState(false);
    const [isFetchingContent, setIsFetchingContent] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const dimensionsRef = useRef();
    const router = useRouter();
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const { t } = useTranslation('explore');

    // Extract roomId and iframeRoomId from the query parameters
    const roomId = _.get(router, 'query.roomId[0]');
    const iframeRoomId = _.get(router, 'query.roomId[1]');
    const myPowerLevel = matrix.spaces.get(roomId)?.events?.get('m.room.power_levels').values().next().value.getContent().users[matrixClient.getUserId()];
    const currentTemplate = iframeRoomId && selectedSpaceChildren[selectedSpaceChildren.length - 1]?.find(space => space.room_id === iframeRoomId).template;

    // Redirect to the default room if no roomId is provided
    useEffect(() => {
        if (!roomId) {
            router.push(`/explore/${getConfig().publicRuntimeConfig.contextRootSpaceRoomId}`);
        }
    }, [roomId, router]);

    // Fetch room content when the iframeRoomId changes
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const checkForRoomContent = async () => {
            await matrix.hydrateRoomContent(iframeRoomId, signal);
        };

        iframeRoomId && checkForRoomContent();

        return () => controller.abort();
    }, [iframeRoomId, matrix]);

    // Call API to fetch and add room hierarchy to selectedSpaceChildren
    const callApiAndAddToObject = useCallback(async (e, roomId) => {
        if (!selectedSpaceChildren) return;
        e && e.preventDefault();
        logger.debug('Fetch the room hierarchy for ' + roomId);
        const getSpaceHierarchy = async () => await matrix.roomHierarchy(roomId, null, 1);

        const spaceHierarchy = await getSpaceHierarchy()
            .catch(async error => {
                if (error.data?.error.includes('not in room')) {
                    // If the error indicates the user is not in the room and previews are disabled
                    // We prompt the user to join the room.
                    if (confirm(t('You are currently not in room {{roomId}}, and previews are disabled. Do you want to join the room?', { roomId: roomId }))) {
                        const joinRoom = await matrixClient.joinRoom(roomId)
                            .catch(error => setErrorMessage(error.data?.error));

                        // If successfully joined, recursively call 'getSpaceHierarchy' again.
                        if (joinRoom) return await getSpaceHierarchy();
                    }
                } else {
                    return matrix.handleRateLimit(error, () => getSpaceHierarchy())
                        .catch(error => {
                            setErrorMessage(error.message);
                        });  // Handle other errors by setting an error message.
                }
            });
        if (!spaceHierarchy) return;
        const parent = spaceHierarchy[0];

        const getMetaEvent = async (obj) => {
            logger.debug('Getting meta event for ' + (obj.state_key || obj.room_id));
            const metaEvent = async () => await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(obj.state_key || obj.room_id, 'dev.medienhaus.meta');

            if (metaEvent) {
                obj.type = metaEvent.type;
                obj.template = metaEvent.template;
                obj.application = metaEvent.application;
            }
        };

        for (const space of spaceHierarchy) {
            space.parent = parent;
            await getMetaEvent(space)
                .catch((error) => {
                    logger.debug(error);

                    return matrix.handleRateLimit(error, () => getMetaEvent(space))
                        .catch(error => {
                            space.missingMetaEvent = true;
                            setErrorMessage(error.message);
                        });
                });
        }

        setSelectedSpaceChildren((prevState) => {
            // Check if the selected roomId is already inside the array
            let indexOfParent = null;

            for (const [index, children] of prevState.entries()) {
                if (children[0].room_id === roomId) {
                    // If there is a match, return the position and exit the loop
                    indexOfParent = index;
                    break;
                }
            }

            // If indexOfParent is 0 or the context root ID defined in the config, return the new spaceHierarchy
            if (indexOfParent === 0 || roomId === getConfig().publicRuntimeConfig.contextRootSpaceRoomId) return [spaceHierarchy];
            // Otherwise, delete all entries starting with the found index
            if (indexOfParent) prevState.splice(indexOfParent);

            // If indexOfParent is still null, simply add the new spaceHierarchy to the end of the array
            return [...prevState, spaceHierarchy];
        });
    }, [auth, matrix, matrixClient, selectedSpaceChildren, t]);

    // Handle route changes and fetch room content

    useEffect(() => {
        let cancelled = false;

        const onRouterChange = async () => {
            setIsFetchingContent(roomId);
            setManageContextActionToggle(false);
            await callApiAndAddToObject(null, roomId);
            setIsFetchingContent(false);
        };

        if (!cancelled && matrix.initialSyncDone && router.query?.roomId) {
            onRouterChange();
        }

        return () => {
            cancelled = true;
        };
    }, [router.query?.roomId, matrix.initialSyncDone]);

    if (typeof window === 'undefined') return <LoadingSpinner />;

    return (
        <>
            <DefaultLayout.Sidebar>
                <h2 ref={dimensionsRef}>/explore   { _.isEmpty(selectedSpaceChildren) && isFetchingContent && <LoadingSpinnerInline /> }</h2>
                <ServiceTableWrapper>
                    { !navigator.userAgent.includes('iPhone') && !navigator.userAgent.includes('Android') &&
                        !_.isEmpty(selectedSpaceChildren) &&
                        <TreePath
                            selectedSpaceChildren={selectedSpaceChildren}
                            isFetchingContent={isFetchingContent}
                            iframeRoomId={iframeRoomId}
                        />
                    }
                </ServiceTableWrapper>
            </DefaultLayout.Sidebar>

            <DefaultLayout.IframeWrapper>
                { iframeRoomId && !_.isEmpty(selectedSpaceChildren)? (
                    <ExploreIframeViews
                        currentTemplate={currentTemplate}
                        iframeRoomId={iframeRoomId}
                        title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name || selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name}
                    />
                ) : !_.isEmpty(selectedSpaceChildren) && <>
                    <ServiceIframeHeader
                        content={window.location.href}
                        title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name || selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name}
                        removingLink={false}
                        roomId={roomId}
                        manageContextActionToggle={manageContextActionToggle}
                        myPowerLevel={myPowerLevel}
                        setManageContextActionToggle={setManageContextActionToggle}
                    />
                    <ServiceTableWrapper>
                        { manageContextActionToggle ?
                            <ExploreMatrixActions
                                myPowerLevel={myPowerLevel}
                                currentId={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].room_id}
                                parentId={selectedSpaceChildren[selectedSpaceChildren.length - 2]?.[0].room_id}
                                children={selectedSpaceChildren[selectedSpaceChildren.length - 1]}
                                callApiAndAddToObject={callApiAndAddToObject}
                            />
                            : <ServiceTable>
                                { selectedSpaceChildren[selectedSpaceChildren.length - 1]
                                    .sort(function(a, b) {
                                        if (a.type === 'item' && b.type !== 'item') {
                                            return -1; // 'a' comes before 'b'
                                        } else if (a.type !== 'item' && b.type === 'item') {
                                            return 1; // 'a' comes after 'b'
                                        } else {
                                            return 0; // No sorting necessary
                                        }
                                    })
                                    .map((leaf, index) => {
                                        if (leaf.length <= 1) {
                                            return <ErrorMessage key="error-message">
                                                Thank you, { auth.user.displayname }! But our item is in another context! 🍄
                                            </ErrorMessage>;
                                        }

                                        if (index === 0) return null;

                                        // Sort the array to display objects of type 'item' before others
                                        return <TreeLeaves
                                            depth={selectedSpaceChildren.length}
                                            leaf={leaf}
                                            parent={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].room_id}
                                            key={leaf.room_id + '_' + index}
                                            iframeRoomId={iframeRoomId}
                                            isFetchingContent={isFetchingContent}
                                        />;
                                    }) }
                            </ServiceTable>
                        }
                    </ServiceTableWrapper>
                </>
                }
                { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
            </DefaultLayout.IframeWrapper>
        </>
    );
}
