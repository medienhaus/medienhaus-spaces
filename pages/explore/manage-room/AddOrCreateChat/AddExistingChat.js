import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import { useMatrix } from '@/lib/Matrix';
import logger from '../../../../lib/Logging';
import Form from '../../../../components/UI/Form';
import ErrorMessage from '../../../../components/UI/ErrorMessage';
import PreviousNextButtons from '../../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../../components/UI/LoadingSpinnerInline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/shadcn/Select';

export default function AddExistingChat({ allChatRooms, onPreviousAction, currentId, onSuccess, parentName, updateRoomList }) {
    const matrix = useMatrix();
    const [selectedRoom, setSelectedRoom] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [userFeedback, setUserFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation('explore');

    const handleAddChat = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');
        const addChildToParent = await matrix
            .addSpaceChild(currentId, selectedRoom)
            .catch((error) => [setErrorMessage(error.data?.error || t('something went wrong, please try again'))]);

        if (addChildToParent.event_id) {
            logger.log('Added existing room to parentId:', currentId);
            setUserFeedback(`Successfully added to ${parentName}`);
            await updateRoomList(e, currentId);

            _.delay(() => {
                setSelectedRoom('');
                setUserFeedback('');
                onSuccess();
            }, 2500);
        }

        setIsLoading(false);
        onSuccess();
    };

    return (
        <Form onSubmit={handleAddChat}>
            <Select onValueChange={setSelectedRoom}>
                <SelectTrigger>
                    <SelectValue placeholder={`-- ${t('Choose Chat Room')} --`} />
                </SelectTrigger>
                <SelectContent>
                    {allChatRooms.map((room) => {
                        const disabled = matrix.spaces.get(currentId).children?.includes(room.roomId);

                        return (
                            <SelectItem key={room.roomId} disabled={disabled} value={room.roomId}>
                                {room.name}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            {userFeedback && <p>{userFeedback}</p>}
            <PreviousNextButtons disableNext={!selectedRoom || userFeedback} onCancel={onPreviousAction}>
                {isLoading ? <LoadingSpinnerInline inverted /> : t('add')}
            </PreviousNextButtons>
        </Form>
    );
}
