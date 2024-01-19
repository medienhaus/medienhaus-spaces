import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { BookmarkIcon, DeleteBinIcon } from '@remixicons/react/line';
import _ from 'lodash';

import TextButton from '../TextButton';
import { useMatrix } from '../../../lib/Matrix';
import { useAuth } from '../../../lib/Auth';
import LoadingSpinnerInline from '../LoadingSpinnerInline';
import Icon from '../Icon';

const AddBookmark = ({ name, service }) => {
    const [contentCopied, setContentCopied] = useState(false);
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation();
    const router = useRouter();
    const [isCreatingBookmark, setIsCreatingBookmark] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const roomId = _.get(router, 'query.roomId.1') || _.get(router, 'query.roomId.0');
    const bookmarks = matrix.bookmarks;

    const errorHandling = async () => {
        setIsCreatingBookmark(false);
        setErrorMessage(<Icon>
            <DeleteBinIcon />
        </Icon>);
        await new Promise(() => setTimeout(() => {
            setErrorMessage('');
        }, 2000));
    };

    const addBookmarkToMatrix = async () => {
        setIsCreatingBookmark(true);

        const accountData = { bookmarks: bookmarks || [] };
        accountData.bookmarks.push(roomId);

        await matrixClient.setAccountData('dev.medienhaus.spaces.bookmarks', accountData);
        setIsCreatingBookmark(false);

        setContentCopied(true);
        await new Promise(r => setTimeout(r, 2000));
        setContentCopied(false);
    };

    return (
        <TextButton disabled={bookmarks?.includes(roomId)} title={t('Add to bookmarks')} onClick={addBookmarkToMatrix}>
            { isCreatingBookmark ?
                <LoadingSpinnerInline /> :
                contentCopied ?
                    '✔' :
                    errorMessage ?
                        errorMessage :
                        <Icon><BookmarkIcon /></Icon> }
        </TextButton>
    );
};

export default AddBookmark;
