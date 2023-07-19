import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import { useRouter } from 'next/router';

import IframeLayout from '../../components/layouts/iframe';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ServiceIframeHeader from '../etherpad/ServiceIframeHeader';
import ProjectView from './ProjectView';
import ChatIframeView from '../chat/ChatIframeView';
import TableView from './TableView';

// height calculation is mostly guess work at the moment...
const ExploreSection = styled.div`
  ${props => !props.selectedRoomId && 'display: flex;'}
  ${props => !props.selectedRoomId && 'grid-template-columns: repeat(2, 1fr);'}

  gap: var(--margin);
  height: calc(100% - calc(var(--margin) * 4.8));

  .parent {
    color: var(--color-background);
    background: var(--color-foreground);
  }

`;

export default function Explore() {
    const [entryPointId, setEntryPointId] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [roomContent, setRoomContent] = useState();
    const [activePath, setActivePath] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
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
        } else router.push(`/explore/${roomId}`);
        setEntryPointId(roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        !cancelled && initialSetup();

        return () => cancelled = true;
    }, [initialSetup]);

    const handleClicked = async (roomId, template, index, parentId) => {
        if (!roomId) return;
        setActivePath(prevState => {
            prevState.splice(index < 0 ? 0 : index);

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

        if (template === 'chat-link') {
            setCurrentItemType(template);
            router.push(`/explore/${parentId}/${roomId}`);
            setSelectedRoomId(roomId);
            await getContent(roomId);
        }
        if (template === 'studentproject') {
            setCurrentItemType(template);
            router.push(`/explore/${parentId}/${roomId}`);
            setSelectedRoomId(roomId);
            await getContent(roomId);
        }
        if (template === 'sketch-link' || template === 'write-link') {
            console.log('object');
            setCurrentItemType(template);
            router.push(`/explore/${parentId}/${roomId}`);
            setSelectedRoomId(roomId);
            await getContent(roomId);
        } else {
            router.push(`/explore/${roomId}`);
            setSelectedRoomId(null);
        }
    };

    if (!entryPointId || typeof window === 'undefined') return <LoadingSpinner />;

    return (
        <>
            <IframeLayout.Sidebar width={!selectedRoomId && '100%'}>
                <h2 ref={dimensionsRef}>/explore</h2>
                <ExploreSection selectedRoomId={!!selectedRoomId}>
                    <TableView
                        id={entryPointId}
                        handleClick={handleClicked}
                        selectedRoomId={selectedRoomId}
                        activePath={activePath}
                    />
                </ExploreSection>
            </IframeLayout.Sidebar>
            { selectedRoomId && (
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
                                        removeLink={() => console.log('removing pad from parent')}
                                        removingLink={false} />
                                    <ChatIframeView src={roomContent} />
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
