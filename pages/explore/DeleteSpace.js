import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';
import ErrorMessage from '../../components/UI/ErrorMessage';
import Form from '../../components/UI/Form';

const Checkbox = styled.div`
  display: grid;
  grid-auto-flow: column;

  input {
    width: calc(var(--margin) * 2);
    height: calc(var(--margin) * 2);
    cursor: pointer;
    border: unset;
    border-color: var(--color-fg);
    border-style: solid;
    border-width: calc(var(--margin) * 0.2);
    border-radius: unset;
    box-shadow: none;
    appearance: none;
  }
`;

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
            <Checkbox>
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => setIsChecked(!isChecked)}
                />
                <label
                    htmlFor="checkbox">
                    { t('Are you sure you want to irreversibly delete {{name}}?', { name: roomName }) }
                </label>
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
