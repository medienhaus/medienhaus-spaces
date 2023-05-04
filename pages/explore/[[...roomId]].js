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
  ${props => !props.selectedNode && 'grid-template-columns: repeat(2, 1fr);'}

  grid-auto-flow: rows;
  grid-gap: 0 calc(var(--margin) * -0.2);
  height: ${props => props.selectedNode ? 'calc(var(--margin) * 3))' : 'calc(100% - calc(var(--margin) * 4.7))'};

  .parent {
    grid-column: ${props => props.selectedNode ? '1/-1' : '1'};
    width: 15%;
    height: 100%;
    padding-top: var(--margin);
    color: var(--color-background);
    background: var(--color-foreground);
    writing-mode: vertical-rl;
    text-orientation: sideways;
    text-orientation: mixed;
  }

  .child {
    grid-column: 1;
    height: 100%;
    margin-left: 15%;
  }

  .toddler {
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
        console.log('call Api or matrix and add');
        function findObject(structure, id) {
            //this function recursively goes through the nested object until it finds the object with the matching roomId and returns the match.
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
        // we only want to check for new children if we are going deeper into the tree.
        // if the roomId therefore matches the router query, we know the user is going back and don't need to look for new children.
        if (router.query.roomId[0] !== roomId) {
            const newTree = { ...graphObject };
            const foundObject = findObject(newTree, roomId);
            console.log(foundObject);
            if (foundObject.children.length !== foundObject.children_state.length) {
                const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 2)
                    .catch(err => console.debug(err));
                const nest = await createNestedObject(spaceHierarchy);

                foundObject.children = nest.children;
            }
            for (const child of foundObject.children) {
                console.log(child);
                if (child.children.length > 0) continue;
                const spaceHierarchy = await matrix.roomHierarchy(child.room_id, null, 2)
                    .catch(err => console.debug(err));
                const nest = await createNestedObject(spaceHierarchy);
                child.children = nest.children;
            }
            setGraphObject(newTree);
        }
        // if (router.query.roomId[0] !== roomId) {
        //     if (getConfig().publicRuntimeConfig.authProviders.matrix.api) {
        //         const response = await fetch(`${getConfig().publicRuntimeConfig.authProviders.matrix.api}/api/v2/${roomId}`)
        //             .catch(error => console.log(error));
        //         if (!response?.ok) return;
        //         data = await response.json();
        //         data.children = data.item;
        //         data.children.push(...data.context);
        //     } else {
        //         const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 2)
        //             .catch(err => console.debug(err));
        //         // console.log(spaceHierarchy);
        //         const nest = await createNestedObject(spaceHierarchy);
        //         console.log(nest);
        //         // const children = [];
        //         // let parentName;
        //         // for (const space of spaceHierarchy) {
        //         //     if (space.room_id === roomId) {
        //         //         parentName = space.name;
        //         //         continue;
        //         //     }
        //         //     const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(space.room_id, 'dev.medienhaus.meta')
        //         //         .catch((err) => {
        //         //             console.debug(err);
        //         //             space.missingMetaEvent = true;
        //         //         });
        //         //     if (metaEvent) {
        //         //         space.type = metaEvent.type;
        //         //         space.template = metaEvent.template;
        //         //         space.application = metaEvent.application;
        //         //     }
        //         //     // we also add the parent to the object so we can easily access it when we have a selectedNode.
        //         //     space.parent = { id: roomId, name: parentName };

        //         //     // fetch second layer of children

        //         //     children.push(space);
        //         // }
        //         // data = { children: children };
        //         data = nest;
        //     }
        // }

        // setGraphObject(prevTree => {
        //     const newTree = { ...prevTree };
        //     const foundObject = findObject(newTree, roomId);
        //     // if (foundObject.children) return prevTree;
        //     foundObject.children = data?.children;
        //     return newTree;
        // });
    }

    async function createNestedObject(parsedArray, child) {
        const getMetaEvent = async (obj) => {
            console.log('getting meta event');
            console.log(obj);
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

        // if we are running the function for the first time we get the meta event for the first array entry.
        // otherwise the meta event will be collected in the loop below.

        if (!parsedArray[0].metaEvent) getMetaEvent(parsedArray[0]);

        const array = child || parsedArray;

        array[0].children = [];
        // if there already is a parent key we can skip the calls since we already did them.
        // if (!array[0].parent) {

        for (const child of array[0].children_state) {
            const childObject = parsedArray.filter(obj => obj.room_id === child.state_key);

            if (childObject.length > 0) {
                childObject[0].parent = { id: array[0].room_id, name: array[0].name };
                await getMetaEvent(childObject[0]);

                const recursiveChild = await createNestedObject(parsedArray, childObject);
                console.log(recursiveChild);
                array[0].children.push(childObject[0]);
            }
        }
        // }
        console.log(array[0]);
        return array[0];
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
            const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 2)
                .catch(err => console.debug(err));
            const nest = await createNestedObject(spaceHierarchy);
            console.log(nest);
            // const children = [];
            // let parentName;
            // for (const space of spaceHierarchy) {
            //     if (space.room_id === roomId) {
            //         parentName = space.name;
            //         continue;
            //     }
            //     const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(space.room_id, 'dev.medienhaus.meta')
            //         .catch((err) => {
            //             console.debug(err);
            //             space.missingMetaEvent = true;
            //         });
            //     if (metaEvent) {
            //         space.type = metaEvent.type;
            //         space.template = metaEvent.template;
            //         space.application = metaEvent.application;
            //     }

            //     space.parent = { id: roomId, name: parentName };
            //     // children.push(space);
            // }
            // spaceHierarchy[0].children = children;

            router.push(`/explore/${roomId}`);
            // setHierarchy(spaceHierarchy[0]);
            setGraphObject(nest);
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

    const handleClicked = async (roomId, template, isChild, parent) => {
        if (!roomId) return;
        console.log(roomId);

        await callApiAndAddToObject(roomId);
        setActivePath(prevState => {
            if (selectedNode) prevState = prevState.splice(0, prevState.length - 1);

            if ((selectedNode && !isChild) || router.query.roomId[0] === roomId && prevState.length > 1) {
                console.log('parent');
                router.push(`/explore/${prevState[prevState.length - 2]}`);
                return prevState.splice(0, prevState.length - 1);
            } else {
                console.log('child');
                router.push(`/explore/${roomId}`);
                if (parent) return [...prevState, parent, roomId];
                else return [...prevState, roomId];
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
                        handleClick={handleClicked}
                        selectedNode={!!selectedNode}
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

