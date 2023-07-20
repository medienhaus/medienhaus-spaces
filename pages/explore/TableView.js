
import React, { useCallback, useEffect, useState } from 'react';

import ErrorMessage from '../../components/UI/ErrorMessage';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import TreeLeaves from './TreeLeaves';
import TreePath from './TreePath';

function TableView({ handleClick, selectedRoomId, activePath, id, currentItemType, selectedSpaceChildren, setSelectedSpaceChildren, callApiAndAddToObject }) {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    // useEffect(() => {
    //     let cancelled = false;
    //     if (!cancelled) {
    //         if (selectedRoomId) callApiWithInitalNode(null, selectedRoomId, 0, currentItemType, id);
    //         else callApiAndAddToObject(null, id, 0);
    //     }

    //     return () => {
    //         cancelled = true;
    //     };
    // }, [callApiAndAddToObject, callApiWithInitalNode, currentItemType, id, selectedRoomId]);

    // const callApiWithInitalNode = useCallback(async (e, roomId, index, template, parentId) => {
    //     console.log('call initial node');
    //     e && e.preventDefault();
    //     console.debug('call Api or matrix with initial id and add');
    //     const spaceHierarchy = await matrix.roomHierarchy(roomId, null, 1)
    //         .catch(err => console.debug(err));
    //     const parentHierarchy = await matrix.roomHierarchy(parentId, null, 1)
    //         .catch(err => console.debug(err));
    //     const parent = parentHierarchy[0];

    //     async function getMetaEvent(obj) {
    //         console.debug('getting meta event');
    //         const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(obj.state_key || obj.room_id, 'dev.medienhaus.meta')
    //             .catch((err) => {
    //                 console.debug(err);
    //                 obj.missingMetaEvent = true;
    //             });
    //         if (metaEvent) {
    //             obj.type = metaEvent.type;
    //             obj.template = metaEvent.template;
    //             obj.application = metaEvent.application;
    //         }
    //     }
    //     for (const space of parentHierarchy) {
    //         space.parent = parent;
    //         await getMetaEvent(space);
    //     }
    //     for (const space of spaceHierarchy) {
    //         space.parent = parent;
    //         await getMetaEvent(space);
    //     }
    //     await handleClick(roomId, spaceHierarchy[0].template, index, parentId);
    //     setSelectedSpaceChildren([parentHierarchy, spaceHierarchy]);
    // }, [auth, handleClick, matrix, setSelectedSpaceChildren]);

    // if (!data) return <LoadingSpinner />;
    if (!selectedSpaceChildren) return <LoadingSpinner />;

    return (
        <>
            { !navigator.userAgent.includes('iPhone') && !navigator.userAgent.includes('Android') && <TreePath
                selectedRoomId={selectedRoomId}
                data={selectedSpaceChildren}
                callApiAndAddToObject={callApiAndAddToObject}
                activePath={activePath}
            />
            }
        </>
    );
}

export default TableView;
