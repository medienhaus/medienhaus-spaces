import React, { useCallback, useEffect, useRef, useState } from 'react';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import _ from 'lodash';
import styled from 'styled-components';

import { ServiceTable } from '../../components/UI/ServiceTable';
import IframeLayout from '../../components/layouts/iframe';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import ExploreMatrixActions from './manage-room/ExploreMatrixActions';
import ErrorMessage from '../../components/UI/ErrorMessage';
import TreeLeaves from './TreeLeaves';
import TreePath from './TreePath';
import ExploreIframeViews from './ExploreIframeViews';
import DefaultModal from '../../components/UI/Modal';

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
    const dimensionsRef = useRef();
    const router = useRouter();
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    // Extract roomId and iframeRoomId from the query parameters
    const roomId = _.get(router, 'query.roomId[0]');
    const iframeRoomId = _.get(router, 'query.roomId[1]');
    const isCurrentUserModerator = matrix.spaces.get(roomId)?.events?.get('m.room.power_levels').values().next().value.getContent().users[matrixClient.getUserId()];
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

    // Handle route changes and fetch room content
    const onRouterChange = useCallback(async () => {
        setIsFetchingContent(roomId);
        setManageContextActionToggle(false);
        await callApiAndAddToObject(null, roomId);
        setIsFetchingContent(false);
    }, [roomId, callApiAndAddToObject]);

    useEffect(() => {
        let cancelled = false;
        if (!cancelled && matrix.initialSyncDone && router.query?.roomId) {
            onRouterChange();
        }

        return () => {
            cancelled = true;
        };
    }, [router.query?.roomId, matrix.initialSyncDone, onRouterChange]);

    // Call API to fetch and add room hierarchy to selectedSpaceChildren
    const callApiAndAddToObject = useCallback(async (e, roomId) => {
        if (!selectedSpaceChildren) return;
        e && e.preventDefault();
        console.debug('Call API or matrix and add');
        const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
            .catch(err => console.debug(err));
        if (!spaceHierarchy) return;
        const parent = spaceHierarchy[0];

        const getMetaEvent = async (obj) => {
            console.debug('Getting meta event for ' + (obj.state_key || obj.room_id));
            const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(obj.state_key || obj.room_id, 'dev.medienhaus.meta')
                .catch((err) => {
                    console.debug(err);
                    obj.missingMetaEvent = true;
                });

            if (metaEvent) {
                obj.type = metaEvent.type;
                obj.template = metaEvent.template;
                obj.application = metaEvent.application;
            }
        };

        for (const space of spaceHierarchy) {
            space.parent = parent;
            await getMetaEvent(space);
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
    }, [auth, matrix, selectedSpaceChildren]);

    if (typeof window === 'undefined') return <LoadingSpinner />;

    return (
        <>
            <IframeLayout.Sidebar>
                <h2 ref={dimensionsRef}>/explore</h2>
                <ServiceTableWrapper>
                    { !navigator.userAgent.includes('iPhone') && !navigator.userAgent.includes('Android') &&
                        !_.isEmpty(selectedSpaceChildren) &&
                        <TreePath
                            data={selectedSpaceChildren}
                            isFetchingContent={isFetchingContent}
                        />

                    }
                </ServiceTableWrapper>
            </IframeLayout.Sidebar>
            { !_.isEmpty(selectedSpaceChildren) &&
                <IframeLayout.IframeWrapper>

                    { iframeRoomId ? (
                        <ExploreIframeViews
                            currentTemplate={currentTemplate}
                            iframeRoomId={iframeRoomId}
                            title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name || selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name}
                        />
                    ) : <>
                        <ServiceIframeHeader
                            content={window.location.href}
                            title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name || selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name}
                            removingLink={false}
                            roomId={roomId}
                            manageContextActionToggle={manageContextActionToggle}
                            isCurrentUserModerator={isCurrentUserModerator}
                            setManageContextActionToggle={setManageContextActionToggle}
                        />
                        <DefaultModal
                            isOpen={manageContextActionToggle}
                            onRequestClose={() => setManageContextActionToggle(false)}
                            contentLabel="Manage context"
                        >
                            <ExploreMatrixActions
                                isCurrentUserModerator={isCurrentUserModerator}
                                currentId={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].room_id}
                                parentId={selectedSpaceChildren[selectedSpaceChildren.length - 2]?.[0].room_id}
                                children={selectedSpaceChildren[selectedSpaceChildren.length - 1]}
                                callApiAndAddToObject={callApiAndAddToObject}
                            />
                        </DefaultModal>
                        <ServiceTableWrapper>
                            <ServiceTable>
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
                        </ServiceTableWrapper>
                    </>
                    }
                </IframeLayout.IframeWrapper> }
        </>
    );
}

// Set the layout for the Explore component
Explore.getLayout = () => {
    return IframeLayout.Layout;
};
