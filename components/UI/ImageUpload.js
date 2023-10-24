import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';
import LoadingSpinner from './LoadingSpinner';
import LoadingSpinnerInline from './LoadingSpinnerInline';
import ConfirmCancelButtons from './ConfirmCancelButtons';

const Avatar = styled.img`
  display: block;
  max-width: 100%;
  max-height: 60vh;
  margin: 0 auto var(--margin) auto;
`;

const AvatarContainer = styled.div`
  position: relative;
`;

const SpinnerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgb(255 255 255 / 70%);
`;

/**
 * ImageUpload component for selecting and uploading an image.
 *
 * @param {String} currentAvatarUrl - string with the url for the current avatar
 * @param {function} callback - The callback function to handle the uploaded image.
 * @returns {JSX.Element} - The rendered component.
 */

const ImageUpload = ({ currentAvatarUrl, roomId, callback }) => {
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation();
    const imageUploadRef = useRef(null);

    /**
     * Handles the file upload and sends the selected image to a Matrix room.
     *
     * @param {Event} event - The file input change event.
     */

    const handleUpload = useCallback(async (event) => {
        const file = event.target.files[0];

        if (!file) return;

        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);
        // Upload the image to the Matrix content repository
        const uploadedImage = await matrixClient.uploadContent(file, { name: file.name })
            .catch((error) => {
                alert(error.data?.error || t('Something went wrong, please try again.'));
            },
            );
        // Callback to handle the uploaded image's content URI
        if (uploadedImage) callback(uploadedImage.content_uri);

        setIsUploadingImage(false);
    }, [callback, matrixClient, t]);

    const handleDelete = async () => {
        await matrixClient.sendStateEvent(roomId, 'm.room.avatar', {})
            .catch((error) => {
                alert(error.data?.error || t('Something went wrong, please try again.'));
            },
            );
    };

    return (
        <div>
            { currentAvatarUrl && <AvatarContainer>
                <Avatar src={currentAvatarUrl} width="100%" height="100%" />
                { isUploadingImage && (
                    <SpinnerOverlay>
                        <LoadingSpinner />
                    </SpinnerOverlay>
                ) }
            </AvatarContainer>
            }
            <input type="file" accept="image/*" ref={imageUploadRef} style={{ display: 'none' }} onChange={handleUpload} />

            { !currentAvatarUrl ? <button
                disabled={isUploadingImage}
                type="button"
                onClick={() => {
                    imageUploadRef.current.click();
                }}
            >
                { !currentAvatarUrl && isUploadingImage ?
                    <LoadingSpinnerInline inverted /> :
                    t('Upload') }
            </button> :
                <ConfirmCancelButtons warning
                    disabled={isUploadingImage}
                    onClick={() => {
                        imageUploadRef.current.click();
                    }}
                    onCancel={handleDelete}
                    cancelTitle={t('Delete')}>
                    { isUploadingImage ?
                        <LoadingSpinnerInline inverted /> :
                        t('Change') }
                </ConfirmCancelButtons>
            }
        </div>
    );
};

export default ImageUpload;
