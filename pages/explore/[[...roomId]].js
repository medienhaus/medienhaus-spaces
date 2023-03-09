import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
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
import GraphView from './GraphView';

const ExploreSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-flow: rows;
  grid-gap: 0 calc(var(--margin) * -0.2);
  height: calc(100% - calc(var(--margin) * 4.7));

  .parent {
    grid-column: ${props => props.selectedNode ? '1/-1' : '1'};
    height: 100%;
  }

  .child {
    grid-column: 2;
    height: 100%;
  }
`;

export default function Explore() {
    const [, setHierarchy] = useState();
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

    async function callApiAndAddToObject(roomId) {
        console.log('call Api and add');
        function findObject(structure, id) {
            let ret;
            const currentRoomId = structure.id || structure.room_id;
            // base case
            if (currentRoomId=== id) {
                return structure;
            } else {
                // recursion
                structure.children?.forEach(child => {
                    if (!ret) {
                        if (!child.depth) child.depth = structure.depth + 1;
                        const c = findObject(child, id);
                        if (c) ret = c;
                    }
                });
            }
            return ret;
        }
        let data;
        if (router.query.roomId[0] !== roomId) {
            if (getConfig().publicRuntimeConfig.authProviders.matrix.api) {
                const response = await fetch(`${getConfig().publicRuntimeConfig.authProviders.matrix.api}/api/v2/${roomId}`).catch(error => console.log(error));
                if (!response?.ok) return;
                data = await response.json();
                data.children = data.item;
                data.children.push(...data.context);
            } else {
                const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
                    .catch(err => console.debug(err));
                const children = [];
                console.log(spaceHierarchy);
                for (const space of spaceHierarchy) {
                    if (space.room_id === roomId) continue;
                    const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(space.room_id, 'dev.medienhaus.meta').catch(() => {});
                    if (metaEvent) {
                        console.log(metaEvent);
                        space.type = metaEvent.type;
                        space.template = metaEvent.template;
                        space.application = metaEvent.application;
                    }
                    children.push(space);
                }
                data = { children: children };
            }
        }
        console.log(data);

        setGraphObject(prevTree => {
            const newTree = { ...prevTree };
            const foundObject = findObject(newTree, roomId);
            if (foundObject.children) return prevTree;
            foundObject.children = data?.children;
            return newTree;
        });
    }

    const initialContentFetch = useCallback(async (roomId) => {
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
            json.depth = 0;
            router.push(`/explore/${json.id}`);
            setHierarchy(json);
            setGraphObject(json);
        } else {
            console.debug('no api:');

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

            router.push(`/explore/${spaceHierarchy[0].room_id}`);
            setHierarchy(spaceHierarchy[0]);
            setGraphObject(spaceHierarchy[0]);
        }
    }, [matrix]);

    useEffect(() => {
        if (currentRoomId && !graphObject) {
            initialContentFetch(currentRoomId);
        }
        // if (currentRoomId) callApiAndAddToObject(currentRoomId);
    }, [currentRoomId, graphObject, initialContentFetch]);

    useEffect(() => {
        // 8 for border
        dimensionsRef.current && setD3Height(document.querySelector('main').offsetHeight - (8 + dimensionsRef?.current?.offsetHeight + (dimensionsRef?.current?.offsetTop * 2)+ parseInt(window.getComputedStyle(dimensionsRef.current).marginBottom)));
    }, [graphObject]);

    const getRoomContent = async (roomId) => {
        // const object = await fetch(getConfig().publicRuntimeConfig.authProviders.matrix.api + '/api/v2/' + roomId + '/render/json').catch((err) => console.error(err));
        let fetchMessage = matrix.roomContents.get(roomId);
        if (!fetchMessage) {
            fetchMessage = await matrix.hydrateRoomContent(roomId);
            console.log(fetchMessage);
        }
        if (!fetchMessage) return;
        return fetchMessage.body;
        // const object = await fetch('http://192.168.0.50:3009/api/v2/!gBzMkmAvxvlPEwlvdq:moci.space/render/d3/fullTree').catch((err) => console.error(err));

        // if (object?.ok) {
        //     const json = await object.json();
        //     console.log(json);
        // }
    };

    const handleClicked = async (roomId, type, template) => {
        if (!roomId) return;
        // element is the last node clicked on by the user
        // if (!element) return;
        // if (element.data.type === 'context') return;
        // if (element.children) return;
        await callApiAndAddToObject(roomId);
        console.log(roomId);
        setActivePath(prevState => {
            if (router.query.roomId[0] === roomId && activePath.length > 1) {
                console.log('parent');
                router.push(`/explore/${activePath[activePath.length - 2]}`);
                return prevState.splice(0, activePath.length - 1);
            } else {
                console.log('child');
                router.push(`/explore/${roomId}`);
                return [...prevState, roomId];
            }
        });
        // console.log(apicall);

        // setParents(prevState => [...prevState, currentRoomId]);
        // setCurrentRoomId(roomId); //this triggers usEffect to rerender
        // console.log(api);
        // if (type !== 'item') return;

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

        // setSelectedNode(content); // if selected node is not undefined iframe loads the url(type string) from selectedNode

        setSelectedNode(prevState => content === prevState ? null : content); // if selected node is not undefined iframe loads the url(type string) from selectedNode
        // router.push(`/explore/${roomId}`);
        // await callApiAndAddToObject(roomId);

        // setCurrentRoomId(roomId);
    };

    useEffect(() => {
        console.log(graphObject);
    }, [graphObject]);

    if (!graphObject || typeof window === 'undefined') return <LoadingSpinner />;
    return (
        <>
            <IframeLayout.Sidebar width={!selectedNode && '100%'}>
                <h2 ref={dimensionsRef}>/explore</h2>
                <ExploreSection
                    selectedNode={!!selectedNode}
                >
                    <GraphView
                        parsedData={graphObject}
                        parsedHeight={d3Height}
                        parent={activePath[activePath.length - 2]}
                        handleClick={handleClicked}
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

