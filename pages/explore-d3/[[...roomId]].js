import React, { useCallback, useEffect, useRef, useState } from 'react';
// import styled from 'styled-components';
import getConfig from 'next/config';
// import { useTranslation } from 'react-i18next';
// import _ from 'lodash';
import { useRouter } from 'next/router';
// import ContextMultiLevelSelect from '../../components/ContextMultiLevelSelect';
// import { useAuth } from '../../lib/Auth';
// import GraphView from './GraphView';

import IframeLayout from '../../components/layouts/iframe';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import WriteIframeHeader from '../write/WriteIframeHeader';
import ProjectView from './ProjectView';
import ChatIframeView from '../chat/ChatIframeView';
import TreeView from './TreeView';
import GraphView from './GraphView';

// const ExploreSection = styled.div`
//   & > * + * {
//     margin-top: var(--margin);
//   }

//   & > select + select {
//     margin-top: calc(var(--margin) * 0.65);
//   }
// `;

export default function Explore() {
    const [graphObject, setGraphObject] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [d3Height, setD3Height] = useState();
    const [activePath, setActivePath] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
    const dimensionsRef = useRef();
    const router = useRouter();
    const [currentRoomId, setCurrentRoomId] = useState(getConfig().publicRuntimeConfig.contextRootSpaceRoomId);
    const [currentItemType, setCurrentItemType] = useState('');
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const initialContentFetch = useCallback(async (roomId) => {
        // const contents = [];
        // const roomHierarchy = await auth.getAuthenticationProvider('matrix').getMatrixClient().getRoomHierarchy(activeContexts[activeContexts.length - 1], undefined, 1);
        // // Remove the first entry, which is the context itself
        // roomHierarchy.rooms.shift();
        // // Ignore `m.space.child` events that are empty
        // // We're only interested in the -contents- of this context, so filter out everything that's a sub-context
        // for (const room of roomHierarchy.rooms) {
        //     const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(room.room_id, 'dev.medienhaus.meta').catch(() => {});
        //     if (!metaEvent || (metaEvent && metaEvent.type !== 'context')) {
        //         // This is a valid content item we want to show
        //         contents.push({
        //             ...room,
        //             type: metaEvent?.type ?? 'chat', // If there's no meta.type we assume it's a chat room
        //             template: metaEvent?.template,
        //             children: room.children_state,
        //         });
        //     }
        // }
        // console.log(contents);

        // setContents({
        //     name: 'First Level',
        //     children: contents,
        // });

        // initial fetch of object
        const object = await fetch(getConfig().publicRuntimeConfig.authProviders.matrix.api + '/api/v2/' + roomId)
            .catch(async (err) => {
                console.debug(err);
            });
        // const object = await fetch('http://192.168.0.50:3009/api/v2/!gBzMkmAvxvlPEwlvdq:moci.space/render/d3/fullTree').catch((err) => console.error(err));
        if (object?.ok) {
            const json = await object.json();
            json.children = json.item;
            json.children.push(...json.context);
            json.root = true;
            router.push(json.id);

            setGraphObject(json);
        } else {
            console.log('no api:');
            const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
                .catch(err => console.debug(err));
            const children = [];
            for (const space of spaceHierarchy) {
                const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(space.room_id, 'dev.medienhaus.meta').catch(() => {});
                if (metaEvent) {
                    console.log(metaEvent);
                    space.type = metaEvent.type;
                    space.template = metaEvent.template;
                    space.application = metaEvent.application;
                }
                if (space.room_id === roomId) continue;
                children.push(space);
            }
            spaceHierarchy[0].children = children;
            router.push(spaceHierarchy[0].room_id);

            setGraphObject(spaceHierarchy[0]);
        }
    }, [matrix]);

    useEffect(() => {
        if (currentRoomId && !graphObject) {
            initialContentFetch(currentRoomId);
        }
    }, [currentRoomId, graphObject, initialContentFetch]);

    useEffect(() => {
        // 8 for border
        // @TODO resize when resizing browser window
        dimensionsRef.current && setD3Height(document.querySelector('main').offsetHeight - (8 + dimensionsRef?.current?.offsetHeight + (dimensionsRef?.current?.offsetTop * 2)+ parseInt(window.getComputedStyle(dimensionsRef.current).marginBottom)));
    }, [graphObject]);

    const getRoomContent = async (roomId) => {
        let fetchMessage = matrix.roomContents.get(roomId);
        if (!fetchMessage) {
            fetchMessage = await matrix.hydrateRoomContent(roomId);
            console.log(fetchMessage);
        }
        if (!fetchMessage) return;
        return fetchMessage.body;
    };

    const handleClicked = async (roomId, type, template) => {
        console.log(roomId);
        if (!roomId) return;
        console.log('template');
        console.log(template);
        setActivePath(prevState => {
            const parent = activePath[activePath.length - 2];
            if (parent === roomId && activePath.length > 1) return prevState.splice(0, activePath.length - 1);
            else return [...prevState, roomId];
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

        setSelectedNode(content); // if selected node is not undefined iframe loads the url(type string) from selectedNode
        router.push(`/explore-d3/${roomId}`);
    };

    if (!graphObject || typeof window === 'undefined') return <LoadingSpinner />;
    return (
        <>
            <IframeLayout.Sidebar width={!selectedNode && '100%'}>
                <h2 ref={dimensionsRef}>/explore</h2>
                <GraphView
                    parsedData={graphObject}
                    parsedHeight={d3Height}
                    parent={activePath[activePath.length - 2]}
                    handleClick={handleClicked}
                    activePath={activePath}
                />
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
                                        title={matrix.spaces.get(currentRoomId)?.name || matrix.rooms.get(currentRoomId)?.name}
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
                                        title={matrix.spaces.get(currentRoomId)?.name || matrix.rooms.get(currentRoomId)?.name}
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
                                        title={matrix.spaces.get(currentRoomId)?.name || matrix.rooms.get(currentRoomId)?.name}
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

