import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { logger } from 'matrix-js-sdk/lib/logger';

import Bookmark from '../../../assets/icons/bookmark.svg';
import TextButton from '../TextButton';
import { useMatrix } from '../../../lib/Matrix';
import { useAuth } from '../../../lib/Auth';
import CloseIcon from '../../../assets/icons/close.svg';
import LoadingSpinnerInline from '../LoadingSpinnerInline';

const AddBookmark = ({ name, roomId }) => {
    const [contentCopied, setContentCopied] = useState(false);
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation();
    const router = useRouter();
    const [isCreatingBookmark, setIsCreatingBookmark] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const errorHandleing = async () => {
        setIsCreatingBookmark(false);
        setErrorMessage(<CloseIcon fill="var(color-foreground)" />);
        await new Promise(() => setTimeout(() => {
            setErrorMessage('');
        }, 2000));
    };

    const addBookmarkToMatrix = async () => {
        const checkExistingBookmarks = (service) => {
            const allBookmarks = matrix.spaces.get(matrix.serviceSpaces.bookmarks).children;
            const existingBookmark = allBookmarks.find(bookmark => matrix.spaces.get(bookmark)?.name === service);

            return existingBookmark;
        };
        logger.debug('creating bookmark room for ' + name);
        setIsCreatingBookmark(true);
        const link = location.href;
        const firstSlashIndex = router.route.indexOf('/');
        const secondSlashIndex = router.route.indexOf('/', firstSlashIndex + 1);
        const service = router.route.substring(1, secondSlashIndex);
        let bookmarkSpace = checkExistingBookmarks(service);

        if (!bookmarkSpace) {
            // if there is no bookmark space for the service yet, we create one
            bookmarkSpace = await matrix.createRoom(service, true, '', 'invite', 'content', 'link')
                .catch(() => {
                    errorHandleing();

                    return;
                });
            // and add it to the bookmarks space
            await auth.getAuthenticationProvider('matrix')
                .addSpaceChild(matrix.serviceSpaces.bookmarks, bookmarkSpace)
                .catch(() => {
                    errorHandleing();

                    return;
                });
        } else {
            // if the service already has a space, we check if the bookmark already exists
            const bookmarkExists = matrix.spaces.get(bookmarkSpace).children.some(child => matrix.rooms.get(child)?.name === name);
            if (bookmarkExists) {
                //if it exists we display a check mark and return out of the function
                setIsCreatingBookmark(false);
                setContentCopied(true);
                await new Promise(r => setTimeout(r, 2000));
                setContentCopied(false);

                return;
            }
        }

        // we create a room for the bookmark
        const room = await matrix.createRoom(name, false, '', 'invite', 'content', 'link')
            .catch(() => {
                errorHandleing();

                return;
            });
        // and add it to the bookmark space
        await auth.getAuthenticationProvider('matrix')
            .addSpaceChild(bookmarkSpace, room)
            .catch(() => {
                errorHandleing();

                return;
            });
        // then send the link of the bookmark as a message to the room
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: link,
        }).catch(() => {
            errorHandleing();

            return;
        });
        setIsCreatingBookmark(false);

        setContentCopied(true);
        await new Promise(r => setTimeout(r, 2000));
        setContentCopied(false);
    };

    return (
        <TextButton title={t('Add to bookmarks')} onClick={addBookmarkToMatrix}>
            { isCreatingBookmark ?
                <LoadingSpinnerInline /> :
                contentCopied ?
                    '✔' :
                    errorMessage ?
                        errorMessage :
                        <Bookmark fill="var(--color-foreground)" /> }
        </TextButton>
    );
};
export default AddBookmark;
