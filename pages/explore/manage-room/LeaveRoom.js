import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../lib/Auth';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';

/**
 * LeaveRoom component for leaving a Matrix room.
 *
 * @param {string} roomId - The ID of the room to leave.
 * @param {string} parentId - The ID of the parent room or space (if applicable).
 * @param {string} roomName - The name of the room to be left.
 * @param {Function} onCancel - Callback function to cancel the operation.
 * @returns {JSX.Element} - The rendered component.
 */
const LeaveRoom = ({ roomId, parentId, roomName, onCancel }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [isLeaving, setIsLeaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useTranslation();

    const handleLeaveRoom = async () => {
        setIsLeaving(true);

        if (parentId) {
            // Remove the space from its parent if a parentId was provided
            await auth.getAuthenticationProvider('matrix').removeSpaceChild(parentId, roomId)
                .catch(error => {
                    setErrorMessage(error.data?.error || t('Something went wrong. Please try again'));
                    setIsLeaving(false);

                    return;
                });
        }
        // Leave the main room
        await matrixClient.leave(roomId)
            .catch(error => {
                setErrorMessage(error.data?.error || t('Something went wrong. Please try again'));
                setIsLeaving(false);

                return;
            });

        setIsLeaving(false);
        setErrorMessage('');
    };

    return (
        <Form
            onSubmit={handleLeaveRoom}>
            <p>{ t('Are you sure you want to leave {{ name }}?', { name: roomName }) }</p>

            <PreviousNextButtons
                disableNext={isLeaving}
                onCancel={onCancel}
                warning
            >
                { isLeaving ? <LoadingSpinnerInline inverted /> : t('Leave') }
            </PreviousNextButtons>

            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </Form>
    );
};

export default LeaveRoom;
