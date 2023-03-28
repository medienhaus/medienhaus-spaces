
import React, { useCallback, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { partition } from 'd3';
import getConfig from 'next/config';
import { useRouter } from 'next/router';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import TreeLeaves from './TreeLeaves';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

// import { partition } from 'd3';
// import { format } from 'd3';

function GraphView({ parsedData, parsedWidth, parsedHeight, activePath, selectedNode, handleClick }) {
    const [data, setData] = useState(parsedData);
    const [height, setHeight] = useState();
    const [root, setRoot] = useState();
    // const [, setCurrentDepth] = useState(0);
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
        const newTree = { ...data };
        const foundObject = findObject(newTree, roomId);

        const fetchFromMatrix = async () => {
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
        };

        // if the id in the url does not match the id of the clicked leaf we fetch new content.

        if (router.query.roomId[0] !== roomId && !foundObject.children) {
            // if the object does not have any children yet we fetch the next children from the api or from matrix directly
            // while this saves data, it also prevents updates inside the structure from showing up when already browsing through explore
            if (getConfig().publicRuntimeConfig.authProviders.matrix.api) {
                const response = await fetch(`${getConfig().publicRuntimeConfig.authProviders.matrix.api}/api/v2/${roomId}`)
                    .catch(async (error) => {
                        console.debug(error);
                        // if fetching from the api fails we try fetching directly from the matrix server
                        await fetchFromMatrix();
                    });
                if (!response?.ok) return;
                fetchChildren = await response.json();
                fetchChildren.children = [...fetchChildren.item];
                fetchChildren.children.push(...fetchChildren.context);
            } else {
                await fetchFromMatrix();
            }
        }

        setData(() => {
            if (fetchChildren) {
                foundObject.children = fetchChildren.children;
            }

            const newHierarchy = iciclePartition(newTree);
            let p = findObject(newHierarchy, roomId);
            console.log(p);
            // if the already active node is clicked we want to go back to it's parent if possible.
            if (router.query.roomId[0] === roomId) p = p.parent;
            // in case p is null now we know there are no parent nodes and we return the previous state
            if (!p) return newTree;
            if (router.query.roomId[0] !== roomId) {
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
            } else {
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
        await new Promise(r => setTimeout(r, 0)); // hack to actually update positions @TODO fix properly
        await updatePositions(roomId);
        const parentId = leaf.parent?.data.id || leaf.parent?.data.room_id;
        const id = router.query.roomId[0] !== roomId ? roomId : parentId;
        // if id is undefined we can assume there is no known parent and we exit the function
        if (!id) return;
        const type = router.query.roomId[0] !== roomId ? leaf.data.type : leaf.parent.data.type;
        const template = router.query.roomId[0] !== roomId ? leaf.data.template : leaf.parent.data.template;
        // setCurrentDepth(router.query.roomId[0] !== roomId ? leaf.depth : leaf.parent.depth);
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
                // if a node is selected we need to make room for the iframe, therefore dividing the width by 2
                const leafWidth = selectedNode ? (leaf.y1 - leaf.y0) / 2 : leaf.y1 - leaf.y0;
                return <TreeLeaves
                    key={roomId + leaf.y0}
                    width={leafWidth}
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
