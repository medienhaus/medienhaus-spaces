import React, { useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import CachedContextMultiLevelSelect from '../../components/CachedContextMultiLevelSelect';
import ErrorMessage from '../../components/UI/ErrorMessage';

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

const AddExistingItem = ({ currentId, currentName }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixAuthed = auth.getAuthenticationProvider('matrix');
    const applicationsFolder = matrix.applicationsFolder;
    // const templatesToDisplay = getConfig().publicRuntimeConfig.templates.item.concat(getConfig().publicRuntimeConfig.templates.context);
    const [isItem, setIsItem] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const { t } = useTranslation('explore');

    const [selectedLevels, setSelectedLevels] = useState([applicationsFolder]);

    const onLevelSelect = (levels, isLeaf) => {
        setSelectedLevels(levels);
        const isItem = matrix.rooms.get(levels[levels.length - 1]);
        if (isLeaf && getConfig().publicRuntimeConfig.templates.item.includes(isItem?.meta.template)) setIsItem(true);
        else setIsItem(false);
    };

    const addItemToContext = async (itemId, currentId) => {
        // cleanUp();

        const addChildToParent = await matrixAuthed.addSpaceChild(currentId, itemId)
            .catch(console.debug);
        if (addChildToParent?.event_id) {
            // call worked as expected Dialog can be closed.
            // cleanUp();
        } else {
            setErrorMessage(t('something went wrong when trying to add the item to ') + currentName);
        }
    };

    return (
        <AddExistingItemDialog>
            <CachedContextMultiLevelSelect onChange={onLevelSelect} activeContexts={selectedLevels} />
            { isItem && <button onClick={e => addItemToContext(selectedLevels[selectedLevels.length - 1], currentId)}>{ t('add') }</button> }
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </AddExistingItemDialog>
    );
};

export default AddExistingItem;
