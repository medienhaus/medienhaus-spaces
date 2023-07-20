import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import _ from 'lodash';

import IframeLayout from '../../components/layouts/iframe';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import ProjectView from './ProjectView';
import ChatIframeView from '../chat/ChatIframeView';
import Actions from '../../components/actions';
import ErrorMessage from '../../components/UI/ErrorMessage';
import TreeLeaves from './TreeLeaves';
import { breakpoints } from '../../components/_breakpoints';
import TreePath from './TreePath';

// height calculation is mostly guess work at the moment...
const ExploreSection = styled.div`
  width: 100%;
  height: 100%;
  padding: var(--margin);

  .parent {
    color: var(--color-background);
    background: var(--color-foreground);
  }

  @media ${breakpoints.tabletAndAbove} {
    padding: 0 calc(var(--margin) * 1.5);
  }
`;

export default function Explore() {
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [roomContent, setRoomContent] = useState();
    const [activePath, setActivePath] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
    const [hasManageContextActionRights, setHasManageContextActionRights] = useState(true);
    const [selectedSpaceChildren, setSelectedSpaceChildren] = useState([]);
    const [manageContextActionToggle, setManageContextActionToggle] = useState(false);
    const dimensionsRef = useRef();
    const router = useRouter();
    const [currentItemType, setCurrentItemType] = useState('');
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const initialSetup = useCallback(async () => {
    // initial setup to check for entry points for the explore interface
        // we use the roomId from the adress bar if there is one, orherwise we start with the supplied root ID from the config file.
        const roomId = router.query.roomId ? router.query.roomId[0] : getConfig().publicRuntimeConfig.contextRootSpaceRoomId;
        // if there i a second query, we want to use it for the iframe
        const iframeRoomId = router.query.roomId && router.query.roomId[1];

        if (iframeRoomId) {
            router.push(`/explore/${roomId}/${iframeRoomId}`);
            setSelectedRoomId(iframeRoomId);
            setActivePath([roomId, iframeRoomId]);
        } else {
            setActivePath([roomId]);
            router.push(`/explore/${roomId}`);
        }
        callApiAndAddToObject(null, roomId, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        !cancelled && initialSetup();

        return () => cancelled = true;
    }, [initialSetup]);

    const handleClicked = useCallback(async (roomId, template, index, parentId) => {
        console.log(template);
        if (!roomId) return;

        setActivePath(prevState => {
            prevState.splice(index < 0 ? 0 : index + 1);

            return [...prevState, roomId];
        });

        const getContent = async (roomId) => {
            const cachedContent = matrix.roomContents.get(selectedRoomId)?.body;
            if (cachedContent) setRoomContent(cachedContent);
            // if the room is not yet cached we manually try to hydrate the content
            else {
                const content = await matrix.hydrateRoomContent(roomId);
                if (content) setRoomContent(content.body);
            }
        };

        if (template !== 'chat-link' &&
            template !== 'studentproject' &&
            template !== 'sketch-link' &&
            template !== 'write-link') {
            router.push(`/explore/${roomId}`);
            setSelectedRoomId(null);
        } else {
            setCurrentItemType(template);
            router.push(`/explore/${parentId}/${roomId}`);
            setSelectedRoomId(roomId);
            await getContent(roomId);
        }
    }, [matrix, router, selectedRoomId]);

    const callApiAndAddToObject = async (e, roomId, index, template, parentId) => {
        if (!selectedSpaceChildren) return;
        e && e.preventDefault();
        console.log('call Api or matrix and add');
        const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
            .catch(err => console.debug(err));
        if (!spaceHierarchy) return;
        console.log(spaceHierarchy);
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
        await handleClicked(roomId, template, index, parentId);
        setSelectedSpaceChildren((prevState) => {
            prevState.splice(index+1); // delete all entries after the selected row.

            return [...prevState, spaceHierarchy];
        });
    };

    if (typeof window === 'undefined') return <LoadingSpinner />;
    // console.log(selectedSpaceChildren[selectedSpaceChildren.length -1]);

    return (
        <>

            <IframeLayout.Sidebar>
                <h2 ref={dimensionsRef}>/explore</h2>
                { !_.isEmpty(selectedSpaceChildren) &&
                     !navigator.userAgent.includes('iPhone') && !navigator.userAgent.includes('Android') && <TreePath
                    selectedRoomId={selectedRoomId}
                    data={selectedSpaceChildren}
                    callApiAndAddToObject={callApiAndAddToObject}
                    activePath={activePath}
                />

                }
            </IframeLayout.Sidebar>
            { selectedRoomId ? (
                (() => {
                    switch (currentItemType) {
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
                    title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name || 'Header Text'}
                    removeLink={() => console.log('removing sketch from parent')}
                    removingLink={false}
                    hasManageContextActionRights={hasManageContextActionRights}
                    setManageContextActionToggle={setManageContextActionToggle}
                />
                <ExploreSection>
                    { manageContextActionToggle && <Actions
                        currentId={activePath[activePath.length - 1]}
                        parentId={activePath[activePath.length - 2]}
                    /> }

                    { !manageContextActionToggle &&
                        selectedSpaceChildren &&
                            selectedSpaceChildren[selectedSpaceChildren.length - 1]
                                .sort(function(a, b) {
                                    if (a.type === 'item' && b.type !== 'item') {
                                        return -1; // a comes before b
                                    } else if (a.type !== 'item' && b.type === 'item') {
                                        return 1; // a comes after b
                                    } else {
                                        return 0; // no sorting necessary
                                    }
                                }).map((leaf, index) => {
                                    if (leaf.length <= 1) {
                                        return <ErrorMessage key="error-message">
                                            Thank You { auth.user.displayname }! But Our Item Is In Another Context! 🍄
                                        </ErrorMessage>;
                                    }

                                    // we sort the array to display object of the type 'item' before others.
                                    return <TreeLeaves
                                        row={index}
                                        leaf={leaf}
                                        parent={parent}
                                        key={leaf.room_id + '_' + index}
                                        handleClick={callApiAndAddToObject}
                                        selectedRoomId={selectedRoomId}
                                        activePath={activePath}
                                    />;
                                })
                    }
                </ExploreSection>
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
