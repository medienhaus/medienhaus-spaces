
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { partition } from 'd3';
import getConfig from 'next/config';
import _ from 'lodash';
import { useRouter } from 'next/router';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import TreeLeaves from './TreeLeaves';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

// import { partition } from 'd3';
// import { format } from 'd3';

function GraphView({ parsedData, parsedWidth, parsedHeight, activePath, handleClick }) {
    const [data, setData] = useState(parsedData);
    const [height, setHeight] = useState();
    const [root, setRoot] = useState();
    const [currentDepth, setCurrentDepth] = useState(0);
    const router = useRouter();
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const iciclePartition = useCallback((data) => {
        const root = d3
            .hierarchy(data)
            .count()
            .sort((a, b) => b.height - a.height || b.value - a.value);
        return partition()
            .size([
                height,
                ((root.height + 1) * width / 2.5),
            ])(root);
    }, [height, width]);

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            setData(parsedData);
            const newHierarchy = iciclePartition(parsedData);
            newHierarchy.each(
                (d) =>
                    (d.target = {
                        x0: d.x0,
                        x1: d.x1,
                        y0: d.y0,
                        y1: d.y1,
                    }),
            );
            setRoot(newHierarchy.descendants());
        }
        return () => {
            cancelled = true;
        };
    }, [iciclePartition, parsedData]);

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

    function findObject(structure, id) {
        const roomid = structure.id || structure.room_id;
        const dataRoomId = structure.data?.id || structure.data?.room_id;
        const objectId = roomid || dataRoomId;
        let ret;
        // base case
        if (objectId === id) {
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
    async function callApiAndAddToObject(roomId) {
        let fetchChildren;
        if (router.query.roomId[0] !== roomId) {
            console.log('in fetch');
            // if the object does not have any children yet we fetch the next children from the api or from matrix directly
            // @TODO add matrix calls if api isnt available
            // @TODO escaping the fetch prevents recently added spaces from showing up without a manual reload.
            if (getConfig().publicRuntimeConfig.authProviders.matrix.api) {
                const response = await fetch(`${getConfig().publicRuntimeConfig.authProviders.matrix.api}/api/v2/${roomId}`).catch(error => console.log(error));
                if (!response?.ok) return;
                fetchChildren = await response.json();
                fetchChildren.children = [...fetchChildren.item];
                fetchChildren.children.push(...fetchChildren.context);
            } else {
                console.log('in else');

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
                fetchChildren = { children: children };
            }
        }

        setData((prevTree) => {
            const newTree = { ...prevTree };
            const foundObject = findObject(newTree, roomId);
            // @TODO children are in wrong position when appearing for the first time
            if (fetchChildren) foundObject.children = fetchChildren.children;

            // if (foundObject.children) return prevTree;
            // foundObject.children = newNode.children;
            // foundObject.data.children = newNode.data.children;
            const newHierarchy = iciclePartition(newTree);
            let p = findObject(newHierarchy, roomId);
            console.log(p);
            // if the already active node is clicked we want to go back to it's parent if possible.

            if (router.query.roomId[0] === roomId) p = p.parent;

            // in case p is null now we know there are no parent nodes and we return the previous state
            if (!p) return newTree;
            if (fetchChildren) {
                newHierarchy.each(
                    (d) => {
                        if (!d.target) {
                            return d.target = {
                                x0: d.x0,
                                x1: d.x1,
                                y0: d.y0,
                                y1: d.y1,
                            };
                        }
                    },
                );
            }
            if (router.query.roomId[0] === roomId) {
                newHierarchy.each(
                    (d) => {
                        return d.target = {
                            x0: ((d.x0 - p.x0) / (p.x1 - p.x0)) * height,
                            x1: ((d.x1 - p.x0) / (p.x1 - p.x0)) * height,
                            y0: d.y0 - p.y0,
                            y1: d.y1 - p.y0,
                        };
                    },
                );
            }
            setRoot(newHierarchy.descendants());
            return newTree;
        });
    }

    const updatePositions = async (roomId) => {
        setData((prevTree) => {
            const newTree = { ...prevTree };

            const newHierarchy = iciclePartition(newTree);
            let p = findObject(newHierarchy, roomId);
            // if the already active node is clicked we want to go back to it's parent if possible.

            if (router.query.roomId[0] === roomId) p = p.parent;
            // in case p is null now we know there are no parent nodes and we return the previous state
            if (!p) return prevTree;
            newHierarchy.each(
                (d) => {
                    return d.target = {
                        x0: ((d.x0 - p.x0) / (p.x1 - p.x0)) * height,
                        x1: ((d.x1 - p.x0) / (p.x1 - p.x0)) * height,
                        y0: d.y0 - p.y0,
                        y1: d.y1 - p.y0,
                    };
                },
            );
            setRoot(newHierarchy.descendants());
            return newTree;
        });

        // setRoot(newHierarchy.descendants());
    };
    const onClick = async (roomId, leaf) => {
        await callApiAndAddToObject(roomId);
        await new Promise(r => setTimeout(r, 0));
        await updatePositions(roomId);

        const id = router.query.roomId[0] !== roomId ? roomId : leaf.parent?.data.id;
        // if id is undefined we can assume there is no known parent and we exit the function
        if (!id) return;
        const type = router.query.roomId[0] !== roomId ? leaf.data.type : leaf.parent.data.type;
        const template = router.query.roomId[0] !== roomId ? leaf.data.template : leaf.parent.data.template;
        setCurrentDepth(router.query.roomId[0] !== roomId ? leaf.depth : leaf.parent.depth);
        handleClick(id, type, template);
    };

    if (!height || !root) return <LoadingSpinner />;
    return (
        <div
            style={{ position: 'absolute' }}
        >{ root.map(leaf => {
                function rectHeight(d) {
                    return d.x1 - d.x0;
                }
                const roomId = leaf.data.id || leaf.data.room_id;
                return <TreeLeaves
                    width={leaf.y1 - leaf.y0}
                    height={leaf.target ? rectHeight(leaf.target) : rectHeight(leaf)}
                    parsedHeight={height}
                    name={leaf.data.name}
                    handleClick={onClick}
                    leaf={leaf}
                    translateX={leaf.target.y0}
                    translateY={leaf.target.x0}
                    roomId={roomId} />;
            }) }</div>
    );
}

export default GraphView;
