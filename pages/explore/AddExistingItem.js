import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ContextMultiLevelSelect from '../../components/ContextMultiLevelSelect';

const AddExistingItemDialog = styled.div`
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
 * 'ADD EXISTING ITEM' COMPONENT
 * ------------------
 *
 * @param {String} currentId — id of the current observed explore room
 *
 * @TODO
 *  - some functions regarding spaces of spaces in the application folders needs to be implemented in the future. But as this is not a featureset of our current stack for now it could not be tested fully.
 *
*/

const AddExistingItem = ({ currentId }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixAuthed = auth.getAuthenticationProvider('matrix');
    const serviceSpaces = matrix.serviceSpaces;
    const applicationsFolder = matrix.applicationsFolder;

    const { t } = useTranslation('explore');

    const [activeContexts, setActiveContexts] = useState([applicationsFolder]);

    return (
        <AddExistingItemDialog>

            { /* { observedIdPath.map((id) => { // loop trough all of the selected Levels
                return <SingleLevel level={servicesCache.find(({ roomId }) => roomId === id)} setObservedIdPath={setObservedIdPath} setAddable={setAddable} />;
            })
            } */ }
            <ContextMultiLevelSelect onChange={setActiveContexts} activeContexts={activeContexts} />

        </AddExistingItemDialog>
    );
};

export default AddExistingItem;
