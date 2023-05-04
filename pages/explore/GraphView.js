
import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';
import { useRouter } from 'next/router';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import TreeLeaves from './TreeLeaves';

function GraphView({ parsedData, parsedHeight, handleClick, selectedNode, activePath }) {
    const [data, setData] = useState(parsedData);
    const [height, setHeight] = useState();
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            setData(parsedData);
            console.log(parsedData);
        }
        return () => {
            cancelled = true;
        };
    }, [parsedData]);

    useEffect(() => {
        let cancelled = false;

        if (!cancelled) {
            parsedHeight && setHeight(parsedHeight);
        }
        return () => {
            cancelled = true;
        };
    }, [parsedHeight]);

    if (!height || !data) return <LoadingSpinner />;
    const focusedId = selectedNode && data.parent ? data.parent.id : router.query?.roomId[0] || getConfig().publicRuntimeConfig.contextRootSpaceRoomId;
    const roomId = data.id || data.room_id;

    return (
        <TreeLeaves
            isParent={focusedId === roomId}
            parent={data.parent}
            display={focusedId === roomId ? 'initial' : 'none'}
            key={roomId}
            height={height}
            name={data.name}
            handleClick={handleClick}
            template={data.template}
            children={data.children}
            directChildren={data.children_state}
            translateX={0}
            translateY={0}
            roomId={roomId}
            missingMetaEvent={data.missingMetaEvent}
            selectedNode={selectedNode}
            activePath={activePath}
            toddler={false}
        />

    // data.map((leaf) => {
    //     const focusedId = router.query?.roomId[0];
    //     // if (focusedId !== leaf.id) return null;
    //     return <TreeLeaves
    //         isParent={focusedId === leaf.id}
    //         display={focusedId === leaf.id ? 'initial' : 'none'}
    //         key={leaf.id}
    //         height={height}
    //         name={leaf.name}
    //         handleClick={onClick}
    //         template={leaf.template}
    //         children={leaf.children}
    //         translateX={0}
    //         translateY={0}
    //         roomId={leaf.id} />;
    // })
    );
}

export default GraphView;
