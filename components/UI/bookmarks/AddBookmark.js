import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookmarkIcon, CheckIcon } from '@remixicons/react/line';
import _ from 'lodash';

import TextButton from '../TextButton';
import { useMatrix } from '../../../lib/Matrix';
import { useAuth } from '../../../lib/Auth';
import LoadingSpinnerInline from '../LoadingSpinnerInline';
import Icon from '../Icon';

/**
 * AddBookmark component for adding a bookmark to the matrix account data.
 * This component displays a button that allows users to add a bookmark to the matrix account data.
 * The button is disabled if the bookmark already exists.
 * @component
 * @param {string} roomId - The id of the room to add to the bookmarks.
 * @returns {JSX.Element} - A JSX element containing the button to add a bookmark.
 */
const AddBookmark = ({ roomId }) => {
    const [contentCopied, setContentCopied] = useState(false);
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation();
    const [isCreatingBookmark, setIsCreatingBookmark] = useState(false);
    const bookmarks = matrix.bookmarks;

    const addBookmarkToMatrix = async () => {
        setIsCreatingBookmark(true);

        const accountData = { bookmarks: bookmarks || [] };
        accountData.bookmarks.push(roomId);

        await matrixClient.setAccountData('dev.medienhaus.spaces.bookmarks', accountData)
            .catch((error) => {
                alert(error.data?.error);
            });
        setIsCreatingBookmark(false);

        setContentCopied(true);
        _.delay(() => {
            setContentCopied(false);
        }, 2000);
    };

    return (
        <TextButton disabled={bookmarks?.includes(roomId)} title={t('Add to bookmarks')} onClick={addBookmarkToMatrix}>
            { isCreatingBookmark ?
                <LoadingSpinnerInline /> :
                contentCopied ? <Icon><CheckIcon /></Icon> : <Icon><BookmarkIcon /></Icon> }
        </TextButton>
    );
};

export default AddBookmark;
