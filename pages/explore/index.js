import React, { useCallback, useEffect, useState } from 'react';
// import styled from 'styled-components';
import getConfig from 'next/config';

// import ContextMultiLevelSelect from '../../components/ContextMultiLevelSelect';
// import { useAuth } from '../../lib/Auth';
import GraphView from './GraphView';
// import jsonData from '../../assets/hierarchy.json';
import IframeLayout from '../../components/layouts/iframe';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

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
    const [selectedNode, setSelectedNode] = useState('');

    const fetchContents = useCallback(async () => {
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
        const object = await fetch('http://192.168.0.50:3009/api/v2/!gBzMkmAvxvlPEwlvdq:moci.space/render/d3/fulltree').catch((err) => console.error(err));
        const json = await object.json();
        console.log(json);
        setGraphObject(json);
    }, []);

    useEffect(() => {
        if (activeContexts) fetchContents();
    }, [activeContexts, fetchContents]);

    const handleClicked = (element) => {
        // element is the last node clicked on by the user
        if (!element) return;
        console.log(element);
        setSelectedNode(element.data.url); // if selected node is not undefined iframe loads the url(type string) from selectedNode
    };

    if (!graphObject) return <LoadingSpinner />;

    return (
        <>
            <IframeLayout.Sidebar width="75rem">
                <h2>/explore</h2>
                <GraphView data={graphObject} callback={handleClicked} />
            </IframeLayout.Sidebar>
            { selectedNode &&

            <IframeLayout.IframeWrapper>
                <IframeLayout.IframeHeader>
                    <h2>bildende kunst und so</h2>
                    <IframeLayout.IframeHeaderButtonWrapper>
                        <button>icons und so</button>
                    </IframeLayout.IframeHeaderButtonWrapper>
                </IframeLayout.IframeHeader>
                <iframe src={selectedNode} />
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

