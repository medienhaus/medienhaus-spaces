import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../lib/Auth';
import { useMatrix } from '../../../lib/Matrix';
import CachedContextMultiLevelSelect from '../../../components/CachedContextMultiLevelSelect';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import Form from '../../../components/UI/Form';

/**
 * Component for adding an existing item to a context.
 *
 * @param {String} currentId - The id of the current observed explore room.
 * @param {Function} onCancel - Callback function to cancel the operation.
 *
 * @returns {JSX.Element} JSX element representing the "Add Existing Item" component.
 */

const AddExistingItem = ({ currentId, onCancel }) => {
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

    const onLevelSelect = (levels) => {
        setSelectedLevels(levels);
        const item = matrix.rooms.get(levels[levels.length - 1]);
        setIsItem(!!item);
        // if (isLeaf && getConfig().publicRuntimeConfig.templates.item.includes(item?.meta.template)) setIsItem(true);
        // else setIsItem(false);
    };

    const addItemToContext = async (e) => {
        e.preventDefault();
        setIsAddingContext(true);

        const addChildToParent = await matrixAuthed.addSpaceChild(currentId, selectedLevels[selectedLevels.length - 1])
            .catch((error) => [
                setErrorMessage((error.data?.error || t('something went wrong, please try again'))),
            ]);
        setIsAddingContext(false);
        if (addChildToParent?.event_id) {
            setSelectedLevels([applicationsFolder]);
            setErrorMessage('');
            onCancel();
        }
    };

    return (
        <Form
            onSubmit={addItemToContext}>
            <CachedContextMultiLevelSelect onChange={onLevelSelect} activeContexts={selectedLevels} />
            <PreviousNextButtons
                disableNext={isAddingContext || !isItem}
                onCancel={onCancel}>{ isAddingContext ? <LoadingSpinnerInline inverted /> : t('add') }
            </PreviousNextButtons>
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </Form>
    );
};

export default AddExistingItem;