
import React, { useEffect, useState } from 'react';

import ErrorMessage from '../../components/UI/ErrorMessage';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import TreeLeaves from './TreeLeaves';
import TreePath from './TreePath';

function TableView({ handleClick, selectedRoomId, activePath, id, currentItemType }) {
    const [data, setData] = useState([]);

    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            if (selectedRoomId) callApiWithInitalNode(null, selectedRoomId, 0, currentItemType, id);
            else callApiAndAddToObject(null, id, 0);
        }
        return () => {
            cancelled = true;
        };
    }, []);

    async function callApiWithInitalNode(e, roomId, index, template, parentId) {
        e && e.preventDefault();
        console.debug('call Api or matrix with initial id and add');
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
        await handleClick(roomId, spaceHierarchy[0].template, index, parentId);
        setData([parentHierarchy, spaceHierarchy]);
    }

    async function callApiAndAddToObject(e, roomId, index, template, parentId) {
        e && e.preventDefault();
        console.log('call Api or matrix and add');
        const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
            .catch(err => console.debug(err));
        if (!spaceHierarchy) return;
        const parent = spaceHierarchy[0];

        const getMetaEvent = async (obj) => {
            console.debug('getting meta event for ' + (obj.state_key || obj.room_id));
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
        await handleClick(roomId, template, index, parentId);
        setData((prevData) => {
            prevData.splice(index + 1); // delete all entries after the selected row.
            return [...prevData, spaceHierarchy];
        });
    }

    if (!data) return <LoadingSpinner />;
    return (
        <>
            { !selectedRoomId && !navigator.userAgent.includes('iPhone') && !navigator.userAgent.includes('Android') && <TreePath
                selectedRoomId={selectedRoomId}
                data={data}
                callApiAndAddToObject={callApiAndAddToObject}
            />
            }
            { data.map((leaf, index) => {
                const numberOfRows = selectedRoomId ? 2 : 1;
                if (index < data.length - numberOfRows) return null; // only show a defined maximum of rows.
                if (selectedRoomId && index != data.length - 2) return null; // if an id is selected only show the selected row.
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
                    selectedRoomId={selectedRoomId}
                    activePath={activePath}
                />;
            }) }
        </>
    );
}

export default TableView;
