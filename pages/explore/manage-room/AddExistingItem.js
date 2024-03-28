import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import CachedContextMultiLevelSelect from '../../../components/CachedContextMultiLevelSelect';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';

/**
 * Component for adding an existing item to a context.
 *
 * @param {String} currentId - The id of the current observed explore room.
 * @param {Function} onCancel - Callback function to cancel the operation.
 * @param {Function} onPreviousAction - Callback function to go back to the previous step.
 *
 * @returns {JSX.Element} JSX element representing the "Add Existing Item" component.
 */

const AddExistingItem = ({ currentId, onPreviousAction, onCancel }) => {
    const auth = useAuth();
    const matrix = useMatrix();
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
        setIsItem(item?.meta.type === 'content');
        // if (isLeaf && getConfig().publicRuntimeConfig.templates.item.includes(item?.meta.template)) setIsItem(true);
        // else setIsItem(false);
    };

    const addItemToContext = async (e) => {
        e.preventDefault();
        setIsAddingContext(true);

        const addChildToParent = await matrixAuthed
            .addSpaceChild(currentId, selectedLevels[selectedLevels.length - 1])
            .catch((error) => [setErrorMessage(error.data?.error || t('something went wrong, please try again'))]);
        setIsAddingContext(false);

        if (addChildToParent?.event_id) {
            setSelectedLevels([applicationsFolder]);
            setErrorMessage('');
            toast.success(t('Item added to context'));
            onCancel();
        }
    };

    return (
        <form className="[&>*+*]:mt-4" onSubmit={addItemToContext}>
            <CachedContextMultiLevelSelect onChange={onLevelSelect} activeContexts={selectedLevels} rootId={currentId} />
            <PreviousNextButtons
                className="mt-4"
                previousLabel={t('Back')}
                nextLabel={isAddingContext ? <LoadingSpinnerInline inverted /> : t('Add')}
                disableNext={isAddingContext || !isItem}
                onCancel={onPreviousAction}
            />
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </form>
    );
};

export default AddExistingItem;
