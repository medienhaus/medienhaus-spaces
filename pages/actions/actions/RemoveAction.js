import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../../lib/Auth';
import { useMatrix } from '../../../lib/Matrix';
import CreateContext from '../CreateContext';
import TemplateSelect from '../TemplateSelect';

const RemoveSection = styled.div`
  & {
    margin-bottom: var(--margin);
  }

  & > button {
    width: 150px;
    margin-right: var(--margin);
    margin-bottom: var(--margin);
  }

  & span:first-of-type {
    background-color: var(--color-hi);
  }
`;

/**
 * COMPONENT 'RemoveAction'
 *
 * @TODO
 *  - the ContextMultiLevelSelect does not updates completly fine after a remove action is successfully executed. Needs an refresh of the childElements for the Select list.
 *
 *
 * @param {String} currentId — the Id of the current observed Room
 * @param {String} parentId — x
 * @param {String} name – x
 * @param {function} activeAction – x
 * @param {function} setShowActions – x
*/

const RemoveAction = ({
    currentId,
    parentId,
    parentPowerLevel,
    name,
    activeAction,
    setShowActions,
    popActiveContexts,
}) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [parentName, setParentName] = useState();

    const removeChildFromParent = async () => {
        const call = await matrix.removeSpaceChild(parentId, currentId);
        if (call?.event_id) { //if an event_id is provided as an response the call were accepted and the currentId removed from the parentId as a m.room.spaceChild
            setShowActions('');
            popActiveContexts();
        }
    };

    useEffect(() => {
        if (activeAction === 'remove') {
            fetchParentName();
        }
    }, [activeAction, parentId]);

    const fetchParentName = async () => {
        const nameEvent = await matrixClient.getStateEvent(
            parentId,
            'm.room.name',
        ).catch(() => {});
        setParentName(nameEvent?.name);
    };

    return (
        <>
            { (parentName && name) &&
        (<RemoveSection>
            <p>are you sure you want to remove this? <span>"{ name }"</span> from <span>"{ parentName }"</span> </p>
            <button onClick={removeChildFromParent}>yes</button>
            <button onClick={() => {setShowActions('');}}>abort!</button>
        </RemoveSection>)
            }
        </>

    );
};

export default RemoveAction;
