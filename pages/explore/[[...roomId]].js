import React, { useCallback, useEffect, useRef, useState } from 'react';
// import styled from 'styled-components';
import getConfig from 'next/config';
// import { useTranslation } from 'react-i18next';
import _ from 'lodash';
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
    const iframe = useRef();
    const [currentItemType, setCurrentItemType] = useState('');

    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    useEffect(() => {
        if (!iframe.current) return;

        const injectCss = () => {
            const styleTag = document.createElement('style');
            const styleContent = document.createTextNode(`
                @media (prefers-color-scheme: dark) {
                    body {
                        color-scheme: dark !important;

                        --accent: #3f3f3f !important;
                        --accent-0pct: #3f3f3f00 !important;
                        --accent-15pct: #3f3f3f26 !important;
                        --accent-50pct: #3f3f3f7F !important;

                        --accent-color: #3f3f3f !important;
                        --accent-color-0pct: #3f3f3f00 !important;
                        --accent-color-15pct: #3f3f3f26 !important;
                        --accent-color-50pct: #3f3f3f7F !important;

                        --icon-button-color: #3f3f3f !important;
                        --icon-button-color-0pct: #3f3f3f00 !important;
                        --icon-button-color-15pct: #3f3f3f26 !important;
                        --icon-button-color-50pct: #3f3f3f7F !important;

                        --primary-color: #f0f0f0 !important;
                        --primary-color-0pct: #f0f0f000 !important;
                        --primary-color-15pct: #f0f0f026 !important;
                        --primary-color-50pct: #f0f0f07F !important;

                        --roomlist-background-color: #0f0f0f !important;
                        --roomlist-background-color-0pct: #0f0f0f00 !important;
                        --roomlist-background-color-15pct: #0f0f0f26 !important;
                        --roomlist-background-color-50pct: #0f0f0f7F !important;

                        --roomlist-highlights-color: #1f1f1f !important;
                        --roomlist-highlights-color-0pct: #1f1f1f00 !important;
                        --roomlist-highlights-color-15pct: #1f1f1f26 !important;
                        --roomlist-highlights-color-50pct: #1f1f1f7F !important;

                        --roomlist-separator-color: #1f1f1f !important;
                        --roomlist-separator-color-0pct: #1f1f1f00 !important;
                        --roomlist-separator-color-15pct: #1f1f1f26 !important;
                        --roomlist-separator-color-50pct: #1f1f1f7F !important;

                        --roomlist-text-color: #f0f0f0 !important;
                        --roomlist-text-color-0pct: #f0f0f000 !important;
                        --roomlist-text-color-15pct: #f0f0f026 !important;
                        --roomlist-text-color-50pct: #f0f0f07F !important;

                        --roomlist-text-secondary-color: #f0f0f0 !important;
                        --roomlist-text-secondary-color-0pct: #f0f0f000 !important;
                        --roomlist-text-secondary-color-15pct: #f0f0f026 !important;
                        --roomlist-text-secondary-color-50pct: #f0f0f07F !important;

                        --sidebar-color: #0f0f0f !important;
                        --sidebar-color-0pct: #0f0f0f00 !important;
                        --sidebar-color-15pct: #0f0f0f26 !important;
                        --sidebar-color-50pct: #0f0f0f7F !important;

                        --timeline-background-color: #0f0f0f !important;
                        --timeline-background-color-0pct: #0f0f0f00 !important;
                        --timeline-background-color-15pct: #0f0f0f26 !important;
                        --timeline-background-color-50pct: #0f0f0f7F !important;

                        --timeline-highlights-color: #1a1f1c !important;
                        --timeline-highlights-color-0pct: #1a1f1c00 !important;
                        --timeline-highlights-color-15pct: #1a1f1c26 !important;
                        --timeline-highlights-color-50pct: #1a1f1c7F !important;

                        --timeline-text-color: #f0f0f0 !important;
                        --timeline-text-color-0pct: #f0f0f000 !important;
                        --timeline-text-color-15pct: #f0f0f026 !important;
                        --timeline-text-color-50pct: #f0f0f07F !important;

                        --timeline-text-secondary-color: #f0f0f0 !important;
                        --timeline-text-secondary-color-0pct: #f0f0f000 !important;
                        --timeline-text-secondary-color-15pct: #f0f0f026 !important;
                        --timeline-text-secondary-color-50pct: #f0f0f07F !important;

                        --warning-color: #ff4b55 !important;
                        --warning-color-0pct: #ff4b5500 !important;
                        --warning-color-15pct: #ff4b5526 !important;
                        --warning-color-50pct: #ff4b557F !important;

                        --avatar-background-colors_0: #1f1f1f !important;
                        --avatar-background-colors_1: #1f1f1f !important;
                        --avatar-background-colors_2: #1f1f1f !important;

                        --username-colors_0: #f0f0f0 !important;
                        --username-colors_1: #f0f0f0 !important;
                        --username-colors_2: #f0f0f0 !important;
                        --username-colors_3: #f0f0f0 !important;
                        --username-colors_4: #f0f0f0 !important;
                        --username-colors_5: #f0f0f0 !important;
                        --username-colors_6: #f0f0f0 !important;
                        --username-colors_7: #f0f0f0 !important;

                        --font-family: "Inter" !important;

                        /* @NOTE: the following variables are found throughout element-web's \`theme-light-custom.css\` (fallback: \`#2e2f32\`) and \`theme-dark-custom.css\` (fallback: \`#edf3ff\`) */
                        --secondary-content: var(--primary-color-50pct) !important;
                        --tertiary-content: var(--primary-color-50pct) !important;
                        --quaternary-content: var(--primary-color-15pct) !important;
                        --quinary-content: var(--primary-color-15pct) !important;
                    }
                }
                * { border-radius: unset !important }
                .mx_LeftPanel_outerWrapper, .mx_LeftPanel_outerWrapper + .mx_ResizeHandle_horizontal { display: none !important }
                .mx_RightPanel_roomSummaryButton, .mx_RightPanel_notifsButton { display: none }
                .mx_RoomHeader_name { pointer-events: none }
                .mx_RoomHeader_chevron { display: none }

                /* @TODO: This can be improved... and should probably not target mobile viewports. It's to make the */
                /* header look like it's on line with our header elements from first & second sidebar. */
                .mx_RoomHeader_wrapper { height: unset; padding: 0; border-bottom: none }
                .mx_RoomHeader { flex: unset; -webkit-box-flex: unset; padding: 2.85rem 0 } 
                .mx_RoomHeader_name { font-weight: bold }
            `);
            styleTag.appendChild(styleContent);
            iframe.current.contentDocument.getElementsByTagName('html')[0].appendChild(styleTag);
        };

        currentItemType === 'chat' && iframe.current.addEventListener('load', injectCss);

        return () => {
            iframe.current && iframe.current.removeEventListener('load', injectCss);
        };
    });

    async function callApiAndAddToObject(roomId) {
        function findObject(structure, id) {
            let ret;
            // base case
            if (structure.id === id) {
                return structure;
            } else {
                // recursion
                structure.children?.forEach(child => {
                    if (!ret) {
                        const c = findObject(child, id);
                        if (c) ret = c;
                    }
                });
            }
            return ret;
        }

        const response = await fetch(`${getConfig().publicRuntimeConfig.authProviders.matrix.api}/api/v2/${roomId}`).catch(error => console.log(error));
        if (!response?.ok) return;
        const data = await response.json();
        data.children = data.item;
        data.children.push(...data.context);
        // setGraphObject(prevTree => {
        //     const newTree = { ...prevTree };
        //     const foundObject = findObject(newTree, roomId);
        //     foundObject.children = data?.children;
        //     return newTree;
        // });

        const newTree = { ...graphObject };
        const foundObject = findObject(newTree, roomId);
        foundObject.children = data?.children;
        return data;
    }

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
        console.log(roomId);
        let fetchMessage = matrix.roomContents.get(roomId);
        console.log(fetchMessage);
        if (!fetchMessage) {
            fetchMessage = await matrix.hydrateRoomContent(roomId);
            console.log(fetchMessage);
            
        }
        if(!fetchMessage) return
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
        console.log(element);
        if(element.data.type === 'context') return
        // if (element.children) return;
        // await callApiAndAddToObject(element.data.id);
        // return fetchChildren;
        let content = null;

        if (element.data.template === 'chat') {
            setCurrentItemType('chat');
            content = `${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${element.data.id}`;

            // await new Promise(res => setTimeout(res, 650)); //transition time in d3js minus 100ms
            // console.log(roomId);
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

            <IframeLayout.IframeWrapper>
                <WriteIframeHeader
                    content={selectedNode}
                    title={matrix.spaces.get(roomId)?.name ||matrix.rooms.get(roomId)?.name}
                    removeLink={() => console.log('removing pad from parent')}
                    removingLink={false} />
                <iframe ref={iframe} src={selectedNode} />
            </IframeLayout.IframeWrapper>
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

