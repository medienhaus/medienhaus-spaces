import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from 'styled-components';

import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import { Button } from '@/components/UI/shadcn/Button';

const AvatarSection = styled.div`
    display: grid;
    grid-auto-flow: row;
    grid-gap: var(--margin);

    @media (min-width: 40em) {
        grid-template-columns: 1fr 1fr;
    }
`;

const Avatar = styled.img`
    width: 50%;

    &.placeholder {
        backdrop-filter: invert(100%);
    }

    @media (min-width: 40em) {
        width: 100%;
    }
`;

const AvatarButtonContainer = styled.div`
    display: grid;
    grid-auto-flow: row;
    grid-gap: var(--margin);
    align-content: start;
`;

/**
 * ImageUpload component for selecting and uploading an image.
 *
 * @param {String} currentAvatarUrl - string with the url for the current avatar
 * @param {function} callback - The callback function to handle the uploaded image.
 * @returns {JSX.Element} - The rendered component.
 */

const ImageUpload = ({ roomId, callback }) => {
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation();
    const avatarFileUploadInput = useRef(null);
    const matrix = useMatrix();
    const currentAvatarUrl = matrix.spaces.get(roomId)?.avatar || matrix.rooms.get(roomId)?.avatar;

    /**
     * Handles the file upload and sends the selected image to a Matrix room.
     *
     * @param {Event} event - The file input change event.
     */

    const handleUpload = useCallback(
        async (event) => {
            const file = event.target.files[0];

            if (!file) return;

            setIsUploadingImage(true);
            const formData = new FormData();
            formData.append('image', file);
            // Upload the image to the Matrix content repository
            const uploadedImage = await matrixClient.uploadContent(file, { name: file.name }).catch((error) => {
                alert(error.data?.error || t('Something went wrong, please try again.'));
            });
            // Callback to handle the uploaded image's content URI
            if (uploadedImage) callback(uploadedImage.content_uri);

            setIsUploadingImage(false);
        },
        [callback, matrixClient, t],
    );

    const handleDelete = async (e) => {
        e.preventDefault();
        await matrixClient.sendStateEvent(roomId, 'm.room.avatar', {}).catch((error) => {
            alert(error.data?.error || t('Something went wrong, please try again.'));
        });
    };

    return (
        <AvatarSection>
            {currentAvatarUrl ? (
                // Render the avatar if we have one
                <Avatar src={currentAvatarUrl} />
            ) : (
                // Render an empty GIF if we don't have an avatar
                <Avatar className="placeholder" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
            )}
            <AvatarButtonContainer>
                <input type="file" accept="image/*" ref={avatarFileUploadInput} style={{ display: 'none' }} onChange={handleUpload} />
                <Button
                    type="button"
                    disabled={isUploadingImage}
                    onClick={() => {
                        avatarFileUploadInput.current.click();
                    }}
                >
                    {t('Browse')} …
                </Button>
                {currentAvatarUrl && (
                    <Button type="button" disabled={isUploadingImage} onClick={handleDelete}>
                        {t('Delete')}
                    </Button>
                )}
            </AvatarButtonContainer>
        </AvatarSection>

        // <div>
        //     {currentAvatarUrl && (
        //         <AvatarContainer>
        //             <Avatar src={currentAvatarUrl} width="100%" height="100%" />
        //             {isUploadingImage && (
        //                 <SpinnerOverlay>
        //                     <LoadingSpinner />
        //                 </SpinnerOverlay>
        //             )}
        //         </AvatarContainer>
        //     )}
        //     <input type="file" accept="image/*" ref={imageUploadRef} style={{ display: 'none' }} onChange={handleUpload} />
        //     <form
        //         onSubmit={(e) => {
        //             e.preventDefault();
        //             imageUploadRef.current.click();
        //         }}
        //         onReset={handleDelete}
        //     >
        //         {!currentAvatarUrl ? (
        //             <Button disabled={isUploadingImage} type="submit">
        //                 {!currentAvatarUrl && isUploadingImage ? <LoadingSpinnerInline inverted /> : t('Upload')}
        //             </Button>
        //         ) : (
        //             <ConfirmCancelButtons
        //                 warning
        //                 disabled={isUploadingImage}
        //                 onCancel={handleDelete}
        //                 cancelTitle={t('Delete')}
        //                 confirmLabel={isUploadingImage ? <LoadingSpinnerInline inverted /> : t('Change')}
        //             />
        //         )}
        //     </form>
        // </div>
    );
};

export default ImageUpload;
