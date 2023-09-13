import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';

const ImagePreview = styled.img`
  display: block;
  max-width: 100%;
  max-height: 60vh;
  margin: 0 auto;
`;

/**
 * ImageUpload component for selecting and uploading an image.
 *
 * @param {Boolean} preview - Previews the selected image if set to true.
 * @param {function} callback - The callback function to handle the uploaded image.
 * @returns {JSX.Element} - The rendered component.
 */

const ImageUpload = ({ preview, callback }) => {
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
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

        if (!file) {
            setPreviewUrl('');

            return;
        }
        // Display image preview when a file is selected and preview === true
        if (preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewUrl(e.target.result);
            };
            reader.readAsDataURL(file);
        }
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
    }, [callback, matrixClient, preview, t]);

    return (

        <>
            { preview && previewUrl && <ImagePreview src={previewUrl} /> }
            <input type="file" accept="image/*" ref={imageUploadRef} style={{ display: 'none' }} onChange={handleUpload} />
            <button disabled={isUploadingImage} type="button" onClick={() => { imageUploadRef.current.click(); }}>{ isUploadingImage ? t('Uploading ...') : t('Upload') }</button>
        </>
    );
};

export default ImageUpload;
