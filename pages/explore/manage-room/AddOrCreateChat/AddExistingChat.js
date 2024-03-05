import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useMatrix } from '@/lib/Matrix';
import logger from '../../../../lib/Logging';
import ErrorMessage from '../../../../components/UI/ErrorMessage';
import PreviousNextButtons from '../../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../../components/UI/LoadingSpinnerInline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/shadcn/Select';

export default function AddExistingChat({ allChatRooms, onPreviousAction, currentId, onSuccess, parentName, updateRoomList }) {
    const matrix = useMatrix();
    const [selectedRoom, setSelectedRoom] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
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
            await updateRoomList(e, currentId);
            toast.success(t('Successfully added to {{parentName}}', { parentName: parentName }));
            setSelectedRoom('');
            onSuccess();
        }

        setIsLoading(false);
        onSuccess();
    };

    return (
        <form className="[&>*+*]:mt-4" onSubmit={handleAddChat}>
            <Select onValueChange={setSelectedRoom}>
                <SelectTrigger>
                    <SelectValue placeholder={`-- ${t('choose chat room')} --`} />
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
            <PreviousNextButtons
                className="mt=4"
                previousLabel={t('Back')}
                nextLabel={isLoading ? <LoadingSpinnerInline inverted /> : t('Add')}
                disableNext={!selectedRoom}
                onCancel={onPreviousAction}
            />
        </form>
    );
}
