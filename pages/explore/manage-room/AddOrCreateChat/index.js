import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ErrorMessage from '../../../../components/UI/ErrorMessage';
import Form from '../../../../components/UI/Form';
import PreviousNextButtons from '../../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../../components/UI/LoadingSpinnerInline';
import { useMatrix } from '../../../../lib/Matrix';
import { ServiceTable } from '../../../../components/UI/ServiceTable';

const Index = ({ currentId, onCancel }) => {
    const matrix = useMatrix();
    const [selectedOption, setSelectedOption] = useState('existing'); // 'existing' or 'new'
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const allChatRooms = Array.from(matrix.rooms.values()).filter(room => !room.meta);
    const [selectedRoom, setSelectedRoom] = useState('');
    const { t } = useTranslation('explore');

    const handleOptionChange = (option) => {
        setSelectedOption(option);
        setErrorMessage('');
    };

    const handleAddChat = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (selectedOption === 'existing') {
            const addChildToParent = await matrix.addSpaceChild(currentId, selectedRoom)
                .catch((error) => [
                    setErrorMessage((error.data?.error || t('something went wrong, please try again'))),
                ]);
            console.log(addChildToParent);
            console.log('Adding existing room to parentId:', currentId);
        } else if (selectedOption === 'new') {
            // Create new room logic
            // Replace the following line with the actual logic to create a new room
            console.log('Creating new room for parentId:', currentId);
        }

        // Reset state and perform cleanup
        setIsLoading(false);
        handleCancel();
    };

    const handleCancel = () => {
        setSelectedOption('existing');
        setErrorMessage('');
        onCancel();
    };

    console.log(allChatRooms);
    console.log(selectedRoom);

    return (
        <Form onSubmit={handleAddChat}>
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

            { selectedOption === 'existing' && (
                <>
                    { /*<ServiceTable>*/ }
                    { /*    <ServiceTable.Caption>*/ }
                    { /*        { t('All available chat rooms') }*/ }
                    { /*    </ServiceTable.Caption>*/ }
                    { /*    <ServiceTable.Head>*/ }
                    { /*        <ServiceTable.Row>*/ }
                    { /*            <ServiceTable.Header align="left">*/ }
                    { /*                { t('Name') }*/ }
                    { /*            </ServiceTable.Header>*/ }
                    { /*        </ServiceTable.Row>*/ }
                    { /*    </ServiceTable.Head>*/ }
                    { /*    <ServiceTable.Body>*/ }
                    { /*        { allChatRooms.map(room => {*/ }
                    { /*            return <ChatRow*/ }
                    { /*                key={room.roomId}*/ }
                    { /*                name={room.name}*/ }
                    { /*                roomId={room.roomId} />;*/ }
                    { /*        })*/ }
                    { /*        }*/ }
                    { /*    </ServiceTable.Body>*/ }
                    { /*</ServiceTable>*/ }
                    <select onChange={(e) => setSelectedRoom(e.target.value)}>
                        { allChatRooms.map(room => {
                            return <option key={room.roomId} value={room.roomId}>{ room.name }</option>;
                        }) }
                    </select>
                </>
            )
            }
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
            <PreviousNextButtons disableNext={!selectedRoom} onCancel={handleCancel}>
                { isLoading ? <LoadingSpinnerInline inverted /> : t('add') }
            </PreviousNextButtons>
        </Form>
    );
};

export default Index;

const ChatRow = ({ name, roomId }) => {
    const [checked, setChecked] = useState(false);

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell>
                { name }
            </ServiceTable.Cell>
            <ServiceTable.Cell align="right">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setChecked(prevState => !prevState)}
                />
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
};
