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
import ProjectView from './ProjectView';
import ChatIframeView from '../chat/ChatIframeView';
import ExploreMatrixActions from './ExploreMatrixActions';
import ErrorMessage from '../../components/UI/ErrorMessage';
import TreeLeaves from './TreeLeaves';
import TreePath from './TreePath';

export default function Explore() {
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [roomContent, setRoomContent] = useState();
    const [isCurrentUserModerator, setIsCurrentUserModerator] = useState(false);
    const [selectedSpaceChildren, setSelectedSpaceChildren] = useState([]);
    const [manageContextActionToggle, setManageContextActionToggle] = useState(false);
    const [isFetchingContent, setIsFetchingContent] = useState(false);
    const dimensionsRef = useRef();
    const router = useRouter();
    const [currentTemplate, setCurrentTemplate] = useState('');
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const onRouterChange = useCallback(async () => {
        setIsFetchingContent(true);
        // initial setup to check for entry points for the explore interface
        // we use the roomId from the adress bar if there is one, orherwise we start with the supplied root ID from the config file.
        const roomId = router.query.roomId ? router.query.roomId[0] : getConfig().publicRuntimeConfig.contextRootSpaceRoomId;
        const userId = matrixClient.credentials.userId;
        setIsFetchingContent(roomId);
        setIsCurrentUserModerator(matrix.spaces.get(roomId)?.events?.get('m.room.power_levels').values().next().value.getContent().users[userId]);
        // if there i a second query, we want to use it for the iframe
        const iframeRoomId = router.query.roomId && router.query.roomId[1];
        const getContent = async (roomId) => {
            const cachedContent = matrix.roomContents.get(selectedRoomId)?.body;
            if (cachedContent) setRoomContent(cachedContent);
            // if the room is not yet cached we manually try to hydrate the content
            else {
                const content = await matrix.hydrateRoomContent(roomId);
                if (content) setRoomContent(content.body);
            }
        };

        if (iframeRoomId) {
            await callApiAndAddToObject(null, iframeRoomId);
            await getContent(iframeRoomId);
            setSelectedRoomId(iframeRoomId);
        } else {
            await callApiAndAddToObject(null, roomId);
            setSelectedRoomId(null);
        }
        setIsFetchingContent(false);
    }, [callApiAndAddToObject, matrix, matrixClient.credentials.userId, router.query.roomId, selectedRoomId]);

    useEffect(() => {
        let cancelled = false;
        if (!cancelled && matrix.initialSyncDone && router.query?.roomId) {
            console.log(router.query.roomId);
            onRouterChange();
        }

        return () => {
            cancelled = true;
        };
    }, [router.query.roomId, matrix.initialSyncDone, onRouterChange]);

    const getMetaEvent = useCallback(async (obj) => {
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
            setCurrentTemplate(obj.template);
        }
    }, [auth]);

    const callApiAndAddToObject = useCallback(async (e, roomId) => {
        if (!selectedSpaceChildren) return;
        e && e.preventDefault();
        console.debug('call Api or matrix and add');
        const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
            .catch(err => console.debug(err));
        if (!spaceHierarchy) return;
        const parent = spaceHierarchy[0];

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
            // if indexOfParent is 0 we simply return the new spaceHierarchy
            if (indexOfParent === 0) return [spaceHierarchy];
            // otherwise we delete all entries starting with the found index
            if (indexOfParent) prevState.splice(indexOfParent);

            // if indexOfParent is still null we simply add the new spaceHierarchy to the end of the array.
            return [...prevState, spaceHierarchy];
        });
    }, [getMetaEvent, matrix, selectedSpaceChildren]);

    if (typeof window === 'undefined') return <LoadingSpinner />;

    return (
        <>

            <IframeLayout.Sidebar>
                <h2 ref={dimensionsRef}>/explore</h2>
                { !_.isEmpty(selectedSpaceChildren) &&
                    !navigator.userAgent.includes('iPhone') && !navigator.userAgent.includes('Android') &&
                    <TreePath
                        selectedRoomId={selectedRoomId}
                        data={selectedSpaceChildren}
                        isFetchingContent={isFetchingContent}
                    />

                }
            </IframeLayout.Sidebar>
            { selectedRoomId ? (
                (() => {
                    switch (currentTemplate) {
                        case 'studentproject':
                            return <ProjectView content={selectedRoomId} />;
                        case 'write-link':
                            return (
                                <IframeLayout.IframeWrapper>
                                    <ServiceIframeHeader
                                        content={roomContent}
                                        title={matrix.spaces.get(router.query.roomId[1])?.name || matrix.rooms.get(router.query.roomId[1])?.name}
                                        removeLink={() => console.log('removing pad from parent')}
                                        removingLink={false} />
                                    <iframe src={roomContent} />
                                </IframeLayout.IframeWrapper>
                            );
                        case 'sketch-link':
                            return (
                                <IframeLayout.IframeWrapper>
                                    <ServiceIframeHeader
                                        content={roomContent}
                                        title={matrix.spaces.get(router.query.roomId[1])?.name || matrix.rooms.get(router.query.roomId[1])?.name}
                                        removeLink={() => console.log('removing sketch from parent')}
                                        removingLink={false} />
                                    <iframe src={roomContent} />
                                </IframeLayout.IframeWrapper>
                            );
                        default:
                            return (
                                <IframeLayout.IframeWrapper>
                                    <ServiceIframeHeader
                                        content={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${selectedRoomId}`}
                                        title={matrix.spaces.get(router.query.roomId[1])?.name || matrix.rooms.get(router.query.roomId[1])?.name}
                                        removeLink={() => console.log('removing chat from parent')}
                                        removingLink={false} />
                                    <ChatIframeView src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${selectedRoomId}`} />
                                </IframeLayout.IframeWrapper>
                            );
                    }
                })()
            ) : !_.isEmpty(selectedSpaceChildren) && <IframeLayout.IframeWrapper>
                <ServiceIframeHeader
                    content={roomContent}
                    title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name || selectedSpaceChildren[selectedSpaceChildren.length -1][0].name}
                    removeLink={() => console.log('removing sketch from parent')}
                    removingLink={false}
                    isCurrentUserModerator={isCurrentUserModerator}
                    setManageContextActionToggle={setManageContextActionToggle}
                />
                <ServiceTable>
                    { manageContextActionToggle &&
                            <ExploreMatrixActions
                                isCurrentUserModerator={isCurrentUserModerator}
                                currentId={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].room_id}
                                parentId={selectedSpaceChildren[selectedSpaceChildren.length - 2]?.[0].room_id}
                            /> }

                    { !manageContextActionToggle &&
                            selectedSpaceChildren[selectedSpaceChildren.length - 1]
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
                                        selectedRoomId={selectedRoomId}
                                        isFetchingContent={isFetchingContent}
                                    />;
                                })
                    }
                </ServiceTable>

                { /* <Actions
                    currentId={activePath[activePath.length - 1]}
                    parentId={activePath?.length >= 2 ? activePath[activePath.length - 2] : undefined}
                    // popActiveContexts={() => setActivePath(prevState => prevState.pop())}
                /> */ }

            </IframeLayout.IframeWrapper> }
        </>
    );
}

Explore.getLayout = () => {
    return IframeLayout.Layout;
};
