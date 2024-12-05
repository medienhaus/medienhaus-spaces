import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '@/lib/Auth';
import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';
import { Input } from '@/components/UI/shadcn/Input';

const ChangeRoomName = ({ roomName, roomId, setRoomName }) => {
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const [newRoomName, setNewRoomName] = useState('');
    const [isChangingName, setIsChangingName] = useState(false);
    const { t } = useTranslation('explore');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsChangingName(true);

        try {
            await matrixClient.setRoomName(roomId, newRoomName);
            setRoomName(newRoomName);
            toast.success(
                t('room name successfully changed to {{newRoomName}}. Please reload the page to see the changes.', { newRoomName }),
            );
        } catch (error) {
            toast.error(error.data?.error);
        } finally {
            setIsChangingName(false);
        }
    };

    return (
        <>
            <form className="[&>*+*]:mt-4" onSubmit={handleSubmit} onReset={() => setNewRoomName(roomName)}>
                <Input
                    type="text"
                    disabled={isChangingName}
                    value={newRoomName || roomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                />
                <ConfirmCancelButtons disabled={roomName === newRoomName} />
            </form>
        </>
    );
};

export default ChangeRoomName;
