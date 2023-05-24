
import React, { useEffect, useState } from 'react';

import ErrorMessage from '../../components/UI/ErrorMessage';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import TreeLeaves from './TreeLeaves';
import TreePath from './TreePath';

function GraphView({ handleClick, selectedNode, activePath, id, currentItemType }) {
    // const [roomId, setRoomId] = useState('');
    const [data, setData] = useState([]);

    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            if (selectedNode) callApiWithInitalNode(null, selectedNode, 0, currentItemType, id);
            else callApiAndAddToObject(null, id, 0);
        }
        return () => {
            cancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function callApiWithInitalNode(e, roomId, index, template, parentId) {
        e && e.preventDefault();
        console.log('call Api or matrix with initial node and add');
        console.log(template);
        const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
            .catch(err => console.debug(err));
        const parentHierarchy = await matrix.roomHierarchy(parentId, null, 1)
            .catch(err => console.debug(err));
        const parent = parentHierarchy[0];

        const getMetaEvent = async (obj) => {
            console.debug('getting meta event');
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
        for (const space of parentHierarchy) {
            space.parent = parent;
            await getMetaEvent(space);
        }
        for (const space of spaceHierarchy) {
            space.parent = parent;
            await getMetaEvent(space);
        }
        // if (!spaceHierarchy[0]) spaceHierarchy.push({ parent: parent })
        await handleClick(roomId, spaceHierarchy[0].template, index, parentId);
        setData([parentHierarchy, spaceHierarchy]);
    }

    async function callApiAndAddToObject(e, roomId, index, template, parentId) {
        e && e.preventDefault();
        console.log('call Api or matrix and add');
        const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
            .catch(err => console.debug(err));
        const parent = spaceHierarchy[0];
        // spaceHierarchy.shift()

        const getMetaEvent = async (obj) => {
            console.debug('getting meta event for ' + obj.state_key || obj.room_id);
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

        for (const space of spaceHierarchy) {
            space.parent = parent;
            await getMetaEvent(space);
        }
        // if (!spaceHierarchy[0]) spaceHierarchy.push({ parent: parent })
        await handleClick(roomId, template, index, parentId);
        setData((prevData) => {
            prevData.splice(index + 1); // delete all entries after the selected row.
            return [...prevData, spaceHierarchy];
        });
    }

    if (!data) return <LoadingSpinner />;
    // const focusedId = selectedNode && data.parent ? data.parent.id : router.query?.roomId[0] || getConfig().publicRuntimeConfig.contextRootSpaceRoomId;
    // const roomId = data.id || data.room_id;
    return (
        <>
            { !selectedNode && <TreePath
                selectedNode={selectedNode}
                data={data}
                callApiAndAddToObject={callApiAndAddToObject}
            />
            }
            { data.map((leaf, index) => {
                const numberOfRows = selectedNode ? 2 : 1;
                if (index < data.length - numberOfRows) return null; // only show a maximum of rows.
                if (selectedNode && index != data.length - 2) return null; // if a node is selected only show the selected row.
                if (leaf.length <= 1) return <ErrorMessage key="error-message">Thank You { auth.user.displayname }! But Our Item Is In Another Context! 🍄</ErrorMessage>;
                // we sort the array to display object of the type 'item' before others.
                const parent = leaf[0];
                const sortedLeaves = [...leaf].sort(function(a, b) {
                    if (a.type === 'item' && b.type !== 'item') {
                        return -1; // a comes before b
                    } else if (a.type !== 'item' && b.type === 'item') {
                        return 1; // a comes after b
                    } else {
                        return 0; // no sorting necessary
                    }
                });
                return <TreeLeaves
                    row={index}
                    data={sortedLeaves}
                    parent={parent}
                    key={leaf[0].room_id + '_' + index}
                    handleClick={callApiAndAddToObject}
                    selectedNode={selectedNode}
                    activePath={activePath}
                />;
            }) }
        </>

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
