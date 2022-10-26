import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ContextMultiLevelSelect from '../../components/ContextMultiLevelSelect';

const AddContextDialog = styled.div`
    & > * + * {
        margin-top: var(--margin);
    }
    & > select + select {
        margin-top: calc(var(--margin) * 0.65);
    }
    & span {
        background-color: var(--color-me);
    }
`;

/**
 * 'ADD EXISTING CONTEXT' COMPONENT
 * ------------------
 *
 * @param {String} parentId — x
 * @param {String} parentName — x
 * @param {function} setShowActions – x
 *
 * @TODO
 *  - for now an not nessesary call is executed to get the name of the selected Id to add to the parent context. This information already exisits in the 'ContextMultiLevelSelect' Component,
 *    but this would need an modification of this component to get this information. Something to implement in the future.
 *
*/

const AddExistingContext = ({ parentId, parentName, setShowActions }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [activeContexts, setActiveContexts] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);

    const [selectedContextName, setSelectedContextName] = useState();

    const [addAllowed, setAddAllowed] = useState();

    const [errorMessage, setErrorMessage] = useState();

    // originated from explore index
    useEffect(() => {
        const fetchContents = async () => {
            const roomHierarchy = await auth.getAuthenticationProvider('matrix').getMatrixClient().getRoomHierarchy(activeContexts[activeContexts.length - 1], undefined, 1);
            // Remove the first entry, which is the context itself
            roomHierarchy.rooms.shift();
            // Ignore `m.space.child` events that are empty
        };
        if (activeContexts) fetchContents();
        fetchRoomName();
    }, [activeContexts, auth]);

    const fetchRoomName = async () => {
        const nameEvent = await matrixClient.getStateEvent(
            activeContexts[activeContexts.length - 1],
            'm.room.name',
        ).catch(() => {});
        setSelectedContextName(nameEvent?.name);
        if (parentId && activeContexts[activeContexts.length - 1]) {
            setErrorMessage(undefined);
            setAddAllowed(true);
        } else {
            setErrorMessage('At least one of the context is not selected properly');
            setAddAllowed(false);
        }
        if (parentId && activeContexts[activeContexts.length - 1] && parentId !== activeContexts[activeContexts.length - 1]) {
            setErrorMessage(undefined);
            setAddAllowed(true);
        } else {
            setErrorMessage('Not possible to add the same context to itself');
            setAddAllowed(false);
        }
    };

    const addContextToParent = async () => {
        const call = await matrix.addSpaceChild(parentId, activeContexts[activeContexts.length - 1]);
        if (call?.event_id) {
            // call worked as expected Dialog can be closed.
            cleanUp();
        } else {
            setErrorMessage(`matrix server refused to add ${selectedContextName} (${activeContexts[activeContexts.length - 1]}) as a child to ${parentId} (${parentId})`);
        }
    };

    // resetting all states back to start for a fresh new interaction.
    const cleanUp = () => {
        setActiveContexts([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
        setErrorMessage(undefined);
        setShowActions('');
    };

    return (
        <AddContextDialog>
            <ContextMultiLevelSelect onChange={setActiveContexts} activeContexts={activeContexts} />
            <p> you are about to add "<span>{ selectedContextName }</span>" to "<span>{ parentName }</span>"</p>
            <button disabled={!addAllowed} onClick={addContextToParent}>add</button>
            <button onClick={cleanUp}>abort</button>
            { errorMessage && <pre>‼️ { errorMessage }</pre> }
        </AddContextDialog>
    );
};

export default AddExistingContext;
