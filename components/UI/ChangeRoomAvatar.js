import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';
import ImageIcon from '../../assets/icons/image.svg';
import DefaultModal from './Modal';
import ImageUpload from './ImageUpload';
import ErrorMessage from './ErrorMessage';

const Avatar = styled.img`
  display: block;
  max-width: 100%;
  max-height: 60vh;
  margin: 0 auto var(--margin) auto;
`;

/**
 * ChangeRoomAvatar component for changing the avatar of a Matrix room.
 *
 * @component
 * @param {string} roomId - The ID of the room for which the avatar is being changed.
 * @returns {JSX.Element} - The rendered component.
 */

const ChangeRoomAvatar = ({ roomId }) => {
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(roomId);
    const currentAvatarUrl = room.getAvatarUrl(matrixClient.baseUrl);
    const canChangeAvatar = room.currentState.maySendStateEvent('m.room.avatar', matrixClient.getUserId());
    const { t } = useTranslation();
    const [isChangingAvatarDialogueOpen, setIsChangingAvatarDialogueOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const uploadRoomAvatar = async (imageUrl) => {
        const request = {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
            body: JSON.stringify({
                url: imageUrl,
            }),
        };
        await fetch(localStorage.getItem('medienhaus_hs_url') + `_matrix/client/r0/rooms/${roomId}/state/m.room.avatar/`, request)
            .catch((error) => {
                setErrorMessage(error.data?.error || t('Something went wrong, please try again.'));
            },
            );
        setErrorMessage('');
    };

    if (!canChangeAvatar) return `${t('You don’t have the required permissions')} ...`;

    return (
        <>
            <button
                title={t('Change Room Avatar')}
                onClick={() => setIsChangingAvatarDialogueOpen(true)}
            >
                <ImageIcon fill="var(--color-foreground)" />
            </button>
            { isChangingAvatarDialogueOpen && (
                <DefaultModal
                    isOpen={isChangingAvatarDialogueOpen}
                    onRequestClose={() => setIsChangingAvatarDialogueOpen(false)}
                    contentLabel={t('Change Room Avatar')}
                    shouldCloseOnOverlayClick={true}
                    headline={t('Change Room Avatar')}
                >
                    { currentAvatarUrl && <Avatar src={currentAvatarUrl} width="500" height="500" /> }
                    <ImageUpload
                        roomId={roomId}
                        callback={uploadRoomAvatar} />
                    { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }

                </DefaultModal>
            ) }
        </>
    );
};

export default ChangeRoomAvatar;
