import React, { useCallback, useEffect, useRef, useState } from 'react';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import _ from 'lodash';

import { ServiceTable } from '../../components/UI/ServiceTable';
import IframeLayout from '../../components/layouts/iframe';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import ExploreMatrixActions from './ExploreMatrixActions';
import ErrorMessage from '../../components/UI/ErrorMessage';
import TreeLeaves from './TreeLeaves';
import TreePath from './TreePath';
import ExploreIframeViews from './ExploreIframeViews';
import DefaultModal from '../../components/UI/Modal';

export default function Explore() {
    const [selectedSpaceChildren, setSelectedSpaceChildren] = useState([]);
    const [manageContextActionToggle, setManageContextActionToggle] = useState(false);
    const [isFetchingContent, setIsFetchingContent] = useState(false);
    const dimensionsRef = useRef();
    const router = useRouter();
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    /**
     * A roomId is set when the route is /explore/<roomId>, otherwise it's undefined
     * @type {String|undefined}
     */

    const roomId = _.get(router, 'query.roomId.0');
    const iframeRoomId = _.get(router, 'query.roomId.1');
    const isCurrentUserModerator = matrix.spaces.get(roomId)?.events?.get('m.room.power_levels').values().next().value.getContent().users[matrixClient.getUserId()];
    const currentTemplate = iframeRoomId && selectedSpaceChildren[selectedSpaceChildren.length -1]?.find(space => space.room_id === iframeRoomId).template;

    if (!roomId) {
        // we use the roomId from the adress bar if there is one, orherwise we start with the supplied root ID from the config file.
        router.push(`/explore/${getConfig().publicRuntimeConfig.contextRootSpaceRoomId}`);
    }

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        const checkForRoomContent = async () => {
            await matrix.hydrateRoomContent(iframeRoomId, signal);
        };
        iframeRoomId && checkForRoomContent();

        return () => controller.abort;
    }, [iframeRoomId, matrix]);

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

    const callApiAndAddToObject = useCallback(async (e, roomId) => {
        if (!selectedSpaceChildren) return;
        e && e.preventDefault();
        console.debug('call Api or matrix and add');
        const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
            .catch(err => console.debug(err));
        if (!spaceHierarchy) return;
        const parent = spaceHierarchy[0];

        const getMetaEvent = async (obj) => {
            console.debug('getting meta event for ' + (obj.state_key || obj.room_id));
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
            // we loop through the first entries of the state to see if the selected roomId is already inside the array
            let indexOfParent = null;
            for (const [index, children] of prevState.entries()) {
                if (children[0].room_id === roomId) {
                    // if we have a match we return the position and exit the loop
                    indexOfParent = index;
                    break;
                }
            }
            // if indexOfParent is 0 or our context root id, which is defined in the config, we simply return the new spaceHierarchy
            if (indexOfParent === 0 || roomId === getConfig().publicRuntimeConfig.contextRootSpaceRoomId) return [spaceHierarchy];
            // otherwise we delete all entries starting with the found index
            if (indexOfParent) prevState.splice(indexOfParent);

            // if indexOfParent is still null we simply add the new spaceHierarchy to the end of the array.
            return [...prevState, spaceHierarchy];
        });
    }, [auth, matrix, selectedSpaceChildren]);

    if (typeof window === 'undefined') return <LoadingSpinner />;

    return (
        <>
            <IframeLayout.Sidebar>
                <h2 ref={dimensionsRef}>/explore</h2>
                { !navigator.userAgent.includes('iPhone') && !navigator.userAgent.includes('Android') &&
                    !_.isEmpty(selectedSpaceChildren) &&
                    <TreePath
                        data={selectedSpaceChildren}
                        isFetchingContent={isFetchingContent}
                    />

                }
            </IframeLayout.Sidebar>
            { !_.isEmpty(selectedSpaceChildren) &&
            <IframeLayout.IframeWrapper>

                { iframeRoomId ? (
                    <ExploreIframeViews
                        currentTemplate={currentTemplate}
                        iframeRoomId={iframeRoomId}
                        title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name || selectedSpaceChildren[selectedSpaceChildren.length -1][0].name}
                    />
                ) : <>
                    <ServiceIframeHeader
                        content={window.location.href}
                        title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name || selectedSpaceChildren[selectedSpaceChildren.length -1][0].name}
                        removingLink={false}
                        roomId={roomId}
                        manageContextActionToggle={manageContextActionToggle}
                        isCurrentUserModerator={isCurrentUserModerator}
                        setManageContextActionToggle={setManageContextActionToggle}
                    />
                    <DefaultModal
                        isOpen={manageContextActionToggle}
                        onRequestClose={() => setManageContextActionToggle(false)}
                        contentLabel="Manage context">
                        <ExploreMatrixActions
                            isCurrentUserModerator={isCurrentUserModerator}
                            currentId={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].room_id}
                            parentId={selectedSpaceChildren[selectedSpaceChildren.length - 2]?.[0].room_id}
                            children={selectedSpaceChildren[selectedSpaceChildren.length - 1]}
                            callApiAndAddToObject={callApiAndAddToObject}
                        />
                    </DefaultModal>
                    <ServiceTable>
                        { selectedSpaceChildren[selectedSpaceChildren.length - 1]
                            .sort(function(a, b) {
                                if (a.type === 'item' && b.type !== 'item') {
                                    return -1; // a comes before b
                                } else if (a.type !== 'item' && b.type === 'item') {
                                    return 1; // a comes after b
                                } else {
                                    return 0; // no sorting necessary
                                }
                            })
                            .map((leaf, index) => {
                                if (leaf.length <= 1) {
                                    return <ErrorMessage key="error-message">
                                                        Thank You { auth.user.displayname }! But Our Item Is In Another Context! 🍄
                                    </ErrorMessage>;
                                }
                                if (index === 0) return null;

                                // we sort the array to display object of the type 'item' before others.
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

                </>
                }
            </IframeLayout.IframeWrapper> }
        </>
    );
}

Explore.getLayout = () => {
    return IframeLayout.Layout;
};
