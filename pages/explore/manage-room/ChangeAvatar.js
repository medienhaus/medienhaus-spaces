import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ImageUpload from '../../../components/UI/ImageUpload';
import ErrorMessage from '../../../components/UI/ErrorMessage';

const ChangeAvatar = ({ roomId }) => {
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useTranslation('explore');

    const uploadRoomAvatar = async (imageUrl) => {
        const request = {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
            body: JSON.stringify({
                url: imageUrl,
            }),
        };
        await fetch(localStorage.getItem('medienhaus_hs_url') + `_matrix/client/r0/rooms/${roomId}/state/m.room.avatar/`, request).catch(
            (error) => {
                setErrorMessage(error.data?.error || 'Something went wrong, please try again.');
            },
        );
        setErrorMessage('');
    };

    return (
        <>
            <ImageUpload roomId={roomId} callback={uploadRoomAvatar} />
            {errorMessage && <ErrorMessage>{t(errorMessage)}</ErrorMessage>}
        </>
    );
};

export default ChangeAvatar;
