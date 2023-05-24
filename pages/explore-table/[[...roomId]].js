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
    // const [, setHierarchy] = useState();
    const [graphObject, setGraphObject] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [activePath, setActivePath] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
    const dimensionsRef = useRef();
    const router = useRouter();
    const [currentItemType, setCurrentItemType] = useState('');
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    // async function callApiAndAddToObject(roomId) {
    //   console.log('call Api or matrix and add');
    //   function findObject(structure, id) {
    //     //this function recursively goes through the nested object until it finds the object with the matching roomId and returns the match.
    //     let ret;
    //     const currentRoomId = structure.id || structure.room_id;
    //     // base case
    //     if (currentRoomId === id) {
    //       return structure;
    //     } else {
    //       // recursion
    //       structure.children?.forEach(child => {
    //         if (!ret) {
    //           if (!child.depth) child.depth = structure.depth + 1;
    //           const c = findObject(child, id);
    //           if (c) ret = c;
    //         }
    //       });
    //     }
    //     return ret;
    //   }

    //   let data;
    //   // we only want to check for new children if we are going deeper into the tree.
    //   // if the roomId therefore matches the router query, we know the user is going back and don't need to look for new children.
    //   if (router.query.roomId[0] !== roomId) {
    //     const newTree = { ...graphObject };
    //     const foundObject = findObject(newTree, roomId);
    //     if (foundObject.children.length !== foundObject.children_state.length) {
    //       const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 2)
    //         .catch(err => console.debug(err));
    //       const nest = await createNestedObject(spaceHierarchy);

    //       foundObject.children = nest.children;
    //     }
    //     for (const child of foundObject.children) {
    //       console.log(child);
    //       if (child.children.length > 0) continue;
    //       const spaceHierarchy = await matrix.roomHierarchy(child.room_id, null, 2)
    //         .catch(err => console.debug(err));
    //       const nest = await createNestedObject(spaceHierarchy);
    //       child.children = nest.children;
    //     }
    //     setGraphObject(newTree);
    //   }
    // }

    // async function createNestedObject(parsedArray, child) {
    //   const getMetaEvent = async (obj) => {
    //     console.log('getting meta event');
    //     console.log(obj);
    //     const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(obj.state_key || obj.room_id, 'dev.medienhaus.meta')
    //       .catch((err) => {
    //         console.debug(err);
    //         obj.missingMetaEvent = true;
    //       });
    //     if (metaEvent) {
    //       obj.type = metaEvent.type;
    //       obj.template = metaEvent.template;
    //       obj.application = metaEvent.application;
    //     }
    //   };

    //   // if we are running the function for the first time we get the meta event for the first array entry.
    //   // otherwise the meta event will be collected in the loop below.

    //   if (!parsedArray[0].metaEvent) getMetaEvent(parsedArray[0]);

    //   const array = child || parsedArray;

    //   array[0].children = [];
    //   // if there already is a parent key we can skip the calls since we already did them.
    //   // if (!array[0].parent) {

    //   for (const child of array[0].children_state) {
    //     const childObject = parsedArray.filter(obj => obj.room_id === child.state_key);

    //     if (childObject.length > 0) {
    //       childObject[0].parent = { id: array[0].room_id, name: array[0].name };
    //       await getMetaEvent(childObject[0]);

    //       const recursiveChild = await createNestedObject(parsedArray, childObject);
    //       console.log(recursiveChild);
    //       array[0].children.push(childObject[0]);
    //     }
    //   }
    //   // }
    //   console.log(array[0]);
    //   return array[0];
    // }

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
    // @TODO dix dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!graphObject) {
            initialContentFetch();
        }
    }, [graphObject, initialContentFetch]);

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
