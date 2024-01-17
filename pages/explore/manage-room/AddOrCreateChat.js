import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../lib/Auth';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import Form from '../../../components/UI/Form';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';

const AddOrCreateChat = ({ parentId, parentName, onCancel }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const [selectedOption, setSelectedOption] = useState('existing'); // 'existing' or 'new'
    const [isAddingAllowed, setIsAddingAllowed] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation('explore');

    const handleOptionChange = (option) => {
        setSelectedOption(option);
        setErrorMessage('');
    };

    const handleAddContext = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (selectedOption === 'existing') {
            // Add existing room logic
            // Replace the following line with the actual logic to add an existing room
            console.log('Adding existing room to parentId:', parentId);
        } else if (selectedOption === 'new') {
            // Create new room logic
            // Replace the following line with the actual logic to create a new room
            console.log('Creating new room for parentId:', parentId);
        }

        // Reset state and perform cleanup
        setIsLoading(false);
        handleCancel();
    };

    const handleCancel = () => {
        setSelectedOption('existing');
        setIsAddingAllowed(false);
        setErrorMessage('');
        onCancel();
    };

    return (
        <Form onSubmit={handleAddContext}>
            <div>
                <label>
                    <input
                        type="radio"
                        value="existing"
                        checked={selectedOption === 'existing'}
                        onChange={() => handleOptionChange('existing')}
                    />
                    { t('Add Existing Room') }
                </label>
                <label>
                    <input
                        type="radio"
                        value="new"
                        checked={selectedOption === 'new'}
                        onChange={() => handleOptionChange('new')}
                    />
                    { t('Create New Room') }
                </label>
            </div>
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
            <PreviousNextButtons disableNext={!isAddingAllowed} onCancel={handleCancel}>
                { isLoading ? <LoadingSpinnerInline inverted /> : t('add') }
            </PreviousNextButtons>
        </Form>
    );
};

export default AddOrCreateChat;
