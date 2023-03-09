
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { partition } from 'd3';
import getConfig from 'next/config';
import _ from 'lodash';
import { useRouter } from 'next/router';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import TreeLeaves from './TreeLeaves';

// import { partition } from 'd3';
// import { format } from 'd3';

function GraphView({ parsedData, parsedWidth, parsedHeight, handleClick, activePath }) {
    const [data, setData] = useState(parsedData);
    const [height, setHeight] = useState();
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            setData(parsedData);
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

    const width = parsedWidth || window.innerWidth;
    // setRoot(iciclePartition(data));

    async function callApiAndAddToObject(roomId) {
        function findObject(structure, id) {
            console.log(structure);
            const objectId = structure.id || structure.data.id;
            let ret;
            // base case
            if (objectId === id) {
                return structure;
            } else {
                // recursion
                structure.children?.forEach(child => {
                    console.log(child);
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
        const newdata = await response.json();
        console.log(newdata);
        newdata.children = [...newdata.item];
        newdata.children.push(...newdata.context);

        // p.children = newNode.children;
        // p.data.children = newNode.data.children;

        // p.children.forEach(child => child.depth += 1);
        // return newTree;

        // If no child array, create an empty array
        // if (!p.children) {
        //     p.children = [];
        //     p.data.children = [];
        // }

        // console.log(p);
    }
    const onClick = async (roomId, type, template) => {
        // await callApiAndAddToObject(roomId, leaf);
        handleClick(roomId, type, template);
    };
    if (!height || !data) return <LoadingSpinner />;
    const focusedId = router.query?.roomId[0];
    const roomId = data.id || data.room_id;

    return (

        <TreeLeaves
            parent={focusedId === roomId}
            display={focusedId === roomId ? 'initial' : 'none'}
            key={roomId}
            height={height}
            name={data.name}
            handleClick={onClick}
            template={data.template}
            children={data.children}
            translateX={0}
            translateY={0}
            roomId={data.id} />

    // data.map((leaf) => {
    //     const focusedId = router.query?.roomId[0];
    //     // if (focusedId !== leaf.id) return null;
    //     return <TreeLeaves
    //         parent={focusedId === leaf.id}
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
