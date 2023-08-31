import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import CachedContextMultiLevelSelect from '../../components/CachedContextMultiLevelSelect';
import ErrorMessage from '../../components/UI/ErrorMessage';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

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
    const [isAddingContext, setIsAddingContext] = useState(false);
    const { t } = useTranslation('explore');

    const [selectedLevels, setSelectedLevels] = useState([applicationsFolder]);

    const onLevelSelect = (levels, isLeaf) => {
        setSelectedLevels(levels);
        const isItem = matrix.rooms.get(levels[levels.length - 1]);
        if (isLeaf && getConfig().publicRuntimeConfig.templates.item.includes(isItem?.meta.template)) setIsItem(true);
        else setIsItem(false);
    };

    const addItemToContext = async (e, itemId, currentId) => {
        e.preventDefault();
        setIsAddingContext(true);

        const addChildToParent = await matrixAuthed.addSpaceChild(currentId, itemId)
            .catch(console.debug);
        if (!addChildToParent?.event_id) {
            setErrorMessage(t('something went wrong when trying to add the item to ') + currentName);
        }
        setSelectedLevels([applicationsFolder]);
        setIsAddingContext(false);
    };

    return (
        <>
            <CachedContextMultiLevelSelect onChange={onLevelSelect} activeContexts={selectedLevels} />
            { isItem && <button
                disabled={isAddingContext}
                onClick={e => addItemToContext(e, selectedLevels[selectedLevels.length - 1], currentId)}>
                { isAddingContext ? <LoadingSpinnerInline /> : t('add') }
            </button> }
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </>
    );
};

export default AddExistingItem;