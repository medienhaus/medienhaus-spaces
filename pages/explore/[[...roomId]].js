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
    // const [, setHierarchy] = useState();
    const [graphObject, setGraphObject] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [d3Height, setD3Height] = useState();
    const [activePath, setActivePath] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
    const dimensionsRef = useRef();
    const router = useRouter();
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

    const initialContentFetch = useCallback(async () => {
        // initial fetch of object
        const roomId = router.query.roomId ? router.query.roomId[0] : getConfig().publicRuntimeConfig.contextRootSpaceRoomId;

        // if an api endpoint is defined we try to fetch the object from the api. othwerwise we set object to null in order to trigger the else loop.
        // @TODO if we don't do this fetch will return status 200 even with the api url eing undefined. it will try to fetch "domain.com/explore/undefined" which will return 200.
        // I am not sure why the url below defaults to "domain.com/explore/undefined/api/v2" instead of "undefined/api/v2". hence the  below.
        const object = getConfig().publicRuntimeConfig.authProviders.matrix.api ?
            await fetch(getConfig().publicRuntimeConfig.authProviders.matrix.api + '/api/v2/' + roomId)
                .catch((err) => console.debug(err)) :
            null;
        // const object = await fetch('http://192.168.0.50:3009/api/v2/!gBzMkmAvxvlPEwlvdq:moci.space/render/d3/fullTree').catch((err) => console.error(err));
        if (object?.ok) {
            const json = await object.json();
            json.children = json.item;
            json.children.push(...json.context);
            json.root = true;
            json.depth = 0;
            router.push(`/explore/${json.id}`);
            // setHierarchy(json);
            setGraphObject(json);
        } else {
            console.debug('no api:');
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
            // setHierarchy(spaceHierarchy[0]);
            setGraphObject(spaceHierarchy[0]);
        }
        // @TODO dix dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matrix]);

    useEffect(() => {
        if (!graphObject) {
            initialContentFetch();
        }
    }, [graphObject, initialContentFetch]);

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
                                        title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name}
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
                                        title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name}
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
                                        title={matrix.spaces.get(router.query.roomId[0])?.name || matrix.rooms.get(router.query.roomId[0])?.name}
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

