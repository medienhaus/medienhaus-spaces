import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Form from '../../../../components/UI/Form';
import PreviousNextButtons from '../../../../components/UI/PreviousNextButtons';
import { useMatrix } from '../../../../lib/Matrix';
import RadioButton from '../../../../components/UI/RadioButton';
import AddExistingChat from './AddExistingChat';
import AddNewChat from './AddNewChat';

const Index = ({ currentId, parentName, onCancel }) => {
    const matrix = useMatrix();
    const [selectedRadioButton, setSelectedRadioButton] = useState('');
    const [selectedOption, setSelectedOption] = useState(''); // 'existing' or 'new'
    // create an array of chat rooms, filtering all rooms with a dev.medienhaus.meta event (not chat rooms), and all dm's
    const allChatRooms = Array.from(matrix.rooms.values())
        .filter(room => !room.meta)
        .filter(room => !matrix.directMessages.has(room.roomId));

    const { t } = useTranslation('explore');

    const handleOptionChange = (option) => {
        setSelectedRadioButton(option);
    };

    const handleCancel = () => {
        setSelectedOption('');
        onCancel();
    };

    if (selectedOption === 'existing') {
        return <AddExistingChat
            allChatRooms={allChatRooms}
            handleCancel={() => setSelectedOption('')}
            onSuccess={handleCancel}
            currentId={currentId}
            parentName={parentName}
        />;
    }

    if (selectedOption === 'new') {
        return <AddNewChat
            handleCancel={() => setSelectedOption('')}
            onSuccess={handleCancel}
            currentId={currentId}
            parentName={parentName}
        />;
    }

    return (
        <Form onSubmit={() => setSelectedOption(selectedRadioButton)}>
            <RadioButton
                value="existing"
                id="existing"
                checked={selectedRadioButton === 'existing'}
                onChange={() => handleOptionChange('existing')}
            >
                { t('Add Existing Room') }
            </RadioButton>
            <RadioButton
                value="new"
                id="new"
                checked={selectedRadioButton === 'new'}
                onChange={() => handleOptionChange('new')}
            >
                { t('Create New Room') }
            </RadioButton>
            <PreviousNextButtons disableNext={!selectedRadioButton} onCancel={handleCancel} />
        </Form>
    );
};

export default Index;

