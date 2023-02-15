import React, { useCallback, useEffect, useRef, useState } from 'react';
// import styled from 'styled-components';
import getConfig from 'next/config';
// import { useTranslation } from 'react-i18next';
// import _ from 'lodash';
import { useRouter } from 'next/router';
// import ContextMultiLevelSelect from '../../components/ContextMultiLevelSelect';
// import { useAuth } from '../../lib/Auth';

import GraphView from './GraphView';
import jsonData from '../../assets/hierarchy.json';
import IframeLayout from '../../components/layouts/iframe';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import WriteIframeHeader from '../write/WriteIframeHeader';
import ProjectView from './ProjectView';
import ChatIframeView from '../chat/ChatIframeView';

// const ExploreSection = styled.div`
//   & > * + * {
//     margin-top: var(--margin);
//   }

//   & > select + select {
//     margin-top: calc(var(--margin) * 0.65);
//   }
// `;

export default function Explore() {
    const [activeContexts] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
    const [graphObject, setGraphObject] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [d3Height, setD3Height] = useState();
    const dimensionsRef = useRef();
    const router = useRouter();
    const [roomId, setRoomId] = useState('');
    const [currentItemType, setCurrentItemType] = useState('');

    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    // async function callApiAndAddToObject(roomId) {
    //     function findObject(structure, id) {
    //         let ret;
    //         // base case
    //         if (structure.id === id) {
    //             return structure;
    //         } else {
    //             // recursion
    //             structure.children?.forEach(child => {
    //                 if (!ret) {
    //                     const c = findObject(child, id);
    //                     if (c) ret = c;
    //                 }
    //             });
    //         }
    //         return ret;
    //     }

    //     const response = await fetch(`${getConfig().publicRuntimeConfig.authProviders.matrix.api}/api/v2/${roomId}`).catch(error => console.log(error));
    //     if (!response?.ok) return;
    //     const data = await response.json();
    //     data.children = data.item;
    //     data.children.push(...data.context);
    //     // setGraphObject(prevTree => {
    //     //     const newTree = { ...prevTree };
    //     //     const foundObject = findObject(newTree, roomId);
    //     //     foundObject.children = data?.children;
    //     //     return newTree;
    //     // });

    //     const newTree = { ...graphObject };
    //     const foundObject = findObject(newTree, roomId);
    //     foundObject.children = data?.children;
    //     return data;
    // }

    const fetchContents = useCallback(async (roomId) => {
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
        const object = await fetch(getConfig().publicRuntimeConfig.authProviders.matrix.api + '/api/v2/' + roomId + '/render/d3/fulltree').catch((err) => console.error(err));
        // const object = await fetch('http://192.168.0.50:3009/api/v2/!gBzMkmAvxvlPEwlvdq:moci.space/render/d3/fullTree').catch((err) => console.error(err));

        if (object?.ok) {
            const json = await object.json();
            // json.children = json.item;
            // json.children.push(...json.context);
            setGraphObject(json);
        } else {
            console.log('else:');
            setGraphObject(jsonData);
        }
    }, []);

    useEffect(() => {
        if (activeContexts) fetchContents(activeContexts[0]);
    }, [activeContexts, fetchContents]);

    useEffect(() => {
        // 8 for border
        dimensionsRef.current && setD3Height(document.querySelector('main').offsetHeight - (8 + dimensionsRef?.current?.offsetHeight + (dimensionsRef?.current?.offsetTop * 2)+ parseInt(window.getComputedStyle(dimensionsRef.current).marginBottom)));
    }, [graphObject]);

    const getRoomContent = async (roomId) => {
        // const object = await fetch(getConfig().publicRuntimeConfig.authProviders.matrix.api + '/api/v2/' + roomId + '/render/json').catch((err) => console.error(err));
        let fetchMessage = matrix.roomContents.get(roomId);
        console.log(fetchMessage);
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

    const handleClicked = async (element, parent) => {
        // element is the last node clicked on by the user
        if (!element) return;
        if (element.data.type === 'context') return;
        // if (element.children) return;
        // await callApiAndAddToObject(element.data.id);
        // return fetchChildren;
        let content = null;

        if (element.data.template === 'chat') {
            setCurrentItemType('chat');
            content = `${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${element.data.id}`;

            // await new Promise(res => setTimeout(res, 650)); //transition time in d3js minus 100ms
            // console.log(roomId);
        } else if (element.data.template === 'studentproject') {
            setCurrentItemType('studentproject');
            content = element.data.id;
        } else {
            setCurrentItemType(element.data.template);
            content = await getRoomContent(element.data.id);
            console.log(content);
            // await new Promise(res => setTimeout(res, 650)); //transition time in d3js minus 100ms
            // console.log(roomId);
        }

        content && !parent && await new Promise(res => setTimeout(res, 650)); // await transition of grid
        // router.push(`/explore/${element.data.id}`);
        setSelectedNode(prevState => content === prevState ? null : content); // if selected node is not undefined iframe loads the url(type string) from selectedNode
        router.push(`/explore/${element.data.id}`);
        setRoomId(element.data.id);
    };
    // useEffect(() => {
    //     console.log(selectedNode);
    // }, [selectedNode]);
    if (!graphObject || typeof window === 'undefined') return <LoadingSpinner />;
    return (
        <>
            <IframeLayout.Sidebar width={!selectedNode && '100%'}>
                <h2 ref={dimensionsRef}>/explore</h2>
                <GraphView parsedData={graphObject}
                    callback={handleClicked}
                    parsedHeight={d3Height}
                    selectedNode={selectedNode} />
            </IframeLayout.Sidebar>

            { selectedNode &&
                <>
                    { currentItemType === 'studentproject' ?
                        <ProjectView content={selectedNode} />
                        : <IframeLayout.IframeWrapper>
                            <WriteIframeHeader
                                content={selectedNode}
                                title={matrix.spaces.get(roomId)?.name ||matrix.rooms.get(roomId)?.name}
                                removeLink={() => console.log('removing pad from parent')}
                                removingLink={false} />
                            <ChatIframeView src={selectedNode} />
                        </IframeLayout.IframeWrapper> }
                </>
            }
            { /* <ExploreSection>
                <ContextMultiLevelSelect onChange={setActiveContexts} activeContexts={activeContexts} />
                { (contents && contents.length > 0) ? (
                    <div>
                        <ol>
                            { contents.map((content) => (
                                <li>
                                    { content.name }
                                    <small>
                                        { content.type && (<> (type: <code>{ content.type }</code>)</>) }
                                        { content.template && (<> (template: <code>{ content.template }</code>)</>) }
                                    </small>
                                </li>
                            )) }
                        </ol>
                    </div>
                ) : (
                    <p>- { t('There are no contents for this context') } -</p>
                ) }
            </ExploreSection> */ }
        </>
    );
}

Explore.getLayout = () => {
    return IframeLayout.Layout;
};

