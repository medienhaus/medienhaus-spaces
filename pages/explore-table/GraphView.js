
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import TreeLeaves from './TreeLeaves';
import TreePath from './TreePath';
import ErrorMessage from '../../components/UI/ErrorMessage';

function GraphView({ parsedData, parsedHeight, handleClick, selectedNode, activePath, id }) {
    // const [roomId, setRoomId] = useState('');
    const [data, setData] = useState([]);

    const [height, setHeight] = useState();
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            callApiAndAddToObject(null, id);
        }
        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        let cancelled = false;

        if (!cancelled) {
            parsedHeight && setHeight(parsedHeight);
        }
        return () => {
            cancelled = true;
        };
    }, [parsedHeight]);

    async function callApiAndAddToObject(e, roomId, index, template, isChild, isParent) {
        e && e.preventDefault();
        console.log('call Api or matrix and add');
        const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
            .catch(err => console.debug(err));
        const parent = spaceHierarchy[0];
        // spaceHierarchy.shift()

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

        for (const space of spaceHierarchy) {
            space.parent = parent;
            await getMetaEvent(space);
        }
        // if (!spaceHierarchy[0]) spaceHierarchy.push({ parent: parent })

        await handleClick(roomId, template, index);
        setData((prevData) => {
            prevData.splice(index + 1); // delete all entries after the selected row.
            return [...prevData, spaceHierarchy];
        });
    }

    if (!height || !data) return <LoadingSpinner />;
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
                if (leaf.length <= 1) return <ErrorMessage>Thank You { auth.user.displayname }! But Our Item Is In Another Context! 🍄</ErrorMessage>;
                return <TreeLeaves
                    row={index}
                    data={leaf}
                    key={index}
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
