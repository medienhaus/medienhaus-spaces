import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import { useRouter } from 'next/router';

import IframeLayout from '../../components/layouts/iframe';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import WriteIframeHeader from '../write/WriteIframeHeader';
import ProjectView from './ProjectView';
import ChatIframeView from '../chat/ChatIframeView';
import GraphView from './GraphView';

// height calculation is guess work at the moment...
const ExploreSection = styled.div`
  ${props => !props.selectedNode && 'display: flex;'}
  ${props => !props.selectedNode && 'grid-template-columns: repeat(2, 1fr);'}

  gap: var(--margin);
  height: calc(100% - calc(var(--margin) * 4.8));

  .parent {
    color: var(--color-background);
    background: var(--color-foreground);
  }

`;

export default function Explore() {
    const [graphObject, setGraphObject] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [activePath, setActivePath] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
    const dimensionsRef = useRef();
    const router = useRouter();
    const [currentItemType, setCurrentItemType] = useState('');
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const initialContentFetch = useCallback(async () => {
    // initial fetch of object
        const roomId = router.query.roomId ? router.query.roomId[0] : getConfig().publicRuntimeConfig.contextRootSpaceRoomId;
        const iframeRoomId = router.query.roomId && router.query.roomId[1];

        if (iframeRoomId) {
            router.push(`/explore-table/${roomId}/${iframeRoomId}`);
            setSelectedNode(iframeRoomId);
            setActivePath([roomId, iframeRoomId]);
        } else router.push(`/explore-table/${roomId}`);
        // setHierarchy(spaceHierarchy[0]);
        setGraphObject(roomId);
    // }
    // @TODO fix dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        !cancelled && initialContentFetch();

        return () => cancelled = true;
    }, [initialContentFetch]);

    const getRoomContent = async (roomId) => {
        let fetchMessage = matrix.roomContents.get(roomId);
        if (!fetchMessage) {
            fetchMessage = await matrix.hydrateRoomContent(roomId);
        }
        if (!fetchMessage) return;
        return fetchMessage.body;
    };

    const handleClicked = async (roomId, template, index, parentId) => {
        if (!roomId) return;
        setActivePath(prevState => {
            prevState.splice(index < 0 ? 0 : index);
            return [...prevState, roomId];
        });

        let content = null;
        if (template === 'chat') {
            setCurrentItemType(template);
            content = `${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${roomId}`;
        }
        if (template === 'studentproject') {
            setCurrentItemType(template);
            content = roomId;
        }
        if (template === 'sketch' || template === 'write') {
            setCurrentItemType(template);
            content = await getRoomContent(roomId);
        }

        // if selected node is not undefined iframe loads the url(type string) from selectedNode
        setSelectedNode(() => {
            if (content) {
                router.push(`/explore-table/${parentId}/${roomId}`);
                return content;
            } else {
                router.push(`/explore-table/${roomId}`);
                return null;
            }
        });
    };

    if (!graphObject || typeof window === 'undefined') return <LoadingSpinner />;
    return (
        <>
            <IframeLayout.Sidebar width={!selectedNode && '100%'}>
                <h2 ref={dimensionsRef}>/explore</h2>
                <ExploreSection selectedNode={!!selectedNode}>
                    <GraphView
                        id={graphObject}
                        handleClick={handleClicked}
                        selectedNode={selectedNode}
                        activePath={activePath}
                    />
                </ExploreSection>
            </IframeLayout.Sidebar>
            { selectedNode && (
                (() => {
                    switch (currentItemType) {
                        case 'studentproject':
                            return <ProjectView content={selectedNode} />;
                        case 'write':
                            return (
                                <IframeLayout.IframeWrapper>
                                    <WriteIframeHeader
                                        content={selectedNode}
                                        title={matrix.spaces.get(router.query.roomId[1])?.name || matrix.rooms.get(router.query.roomId[1])?.name}
                                        removeLink={() => console.log('removing pad from parent')}
                                        removingLink={false} />
                                    <iframe src={selectedNode} />
                                </IframeLayout.IframeWrapper>
                            );
                        case 'sketch':
                            return (
                                <IframeLayout.IframeWrapper>
                                    <WriteIframeHeader
                                        content={selectedNode}
                                        title={matrix.spaces.get(router.query.roomId[1])?.name || matrix.rooms.get(router.query.roomId[1])?.name}
                                        removeLink={() => console.log('removing sketch from parent')}
                                        removingLink={false} />
                                    <iframe src={selectedNode} />
                                </IframeLayout.IframeWrapper>
                            );
                        default:
                            return (
                                <IframeLayout.IframeWrapper>
                                    <WriteIframeHeader
                                        content={selectedNode}
                                        title={matrix.spaces.get(router.query.roomId[1])?.name || matrix.rooms.get(router.query.roomId[1])?.name}
                                        removeLink={() => console.log('removing pad from parent')}
                                        removingLink={false} />
                                    <ChatIframeView src={selectedNode} />
                                </IframeLayout.IframeWrapper>
                            );
                    }
                })()
            ) }
        </>
    );
}

Explore.getLayout = () => {
    return IframeLayout.Layout;
};
