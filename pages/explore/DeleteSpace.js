import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import ErrorMessage from '../../components/UI/ErrorMessage';
import Form from '../../components/UI/Form';
import Checkbox from '../../components/UI/Checkbox';

/**
 * DeleteRoom component for deleting a Matrix room.
 *
 * @param {string} roomId - The ID of the room to delete.
 * @param {string} parentId - The ID of the parent room or space (if applicable).
 * @param {string} roomName - The name of the room to be deleted.
 * @returns {JSX.Element} - The rendered component.
 */
const DeleteRoom = ({ roomId, parentId, roomName }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const { t } = useTranslation();

    const handleDeleteRoom = async () => {
        setIsDeleting(true);

        if (parentId) {
            // remove the space from its parent if a parentId was parsed
            await auth.getAuthenticationProvider('matrix').removeSpaceChild(parentId, roomId)
                .catch(error => {
                    setErrorMessage(error.data?.error || t('Something went wrong. Please try again'));

                    return;
                });
        }
        // Delete the main room
        await matrixClient.deleteRoom(roomId)
            .catch(error => {
                setErrorMessage(error.data?.error || t('Something went wrong. Please try again'));

                return;
            });

        setIsDeleting(false);
        setErrorMessage('');
    };

    return (
        <Form>
            <h2>{ t('Delete') } { roomName }?</h2>
            <Checkbox
                isChecked={isChecked}
                onClick={setIsChecked}>
                { t('Are you sure you want to irreversibly delete {{name}}?', { name: roomName }) }
            </Checkbox>

            <button
                disabled={isDeleting || !isChecked}
                onClick={handleDeleteRoom}
            >
                { isDeleting ? `${t('Deleting')} ...` : t('Delete') }
            </button>
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </Form>
    );
};

export default DeleteRoom;
