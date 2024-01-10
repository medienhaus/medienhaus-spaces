import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { logger } from 'matrix-js-sdk/lib/logger';
import { BookmarkIcon, DeleteBinIcon } from '@remixicons/react/line';

import TextButton from '../TextButton';
import { useMatrix } from '../../../lib/Matrix';
import { useAuth } from '../../../lib/Auth';
import LoadingSpinnerInline from '../LoadingSpinnerInline';
import Icon from '../Icon';

const AddBookmark = ({ name }) => {
    const [contentCopied, setContentCopied] = useState(false);
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation();
    const router = useRouter();
    const [isCreatingBookmark, setIsCreatingBookmark] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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
        const checkExistingBookmarks = (service) => {
            const allBookmarks = matrix.spaces.get(matrix.serviceSpaces.bookmarks).children;

            return allBookmarks.find(bookmark => matrix.spaces.get(bookmark)?.name === service);
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
                    errorHandling();

                    return;
                });
            // and add it to the bookmarks space
            await auth.getAuthenticationProvider('matrix')
                .addSpaceChild(matrix.serviceSpaces.bookmarks, bookmarkSpace)
                .catch(() => {
                    errorHandling();

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
                errorHandling();

                return;
            });
        // and add it to the bookmark space
        await auth.getAuthenticationProvider('matrix')
            .addSpaceChild(bookmarkSpace, room)
            .catch(() => {
                errorHandling();

                return;
            });
        // then send the link of the bookmark as a message to the room
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: link,
        }).catch(() => {
            errorHandling();

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
                        <Icon><BookmarkIcon /></Icon> }
        </TextButton>
    );
};

export default AddBookmark;
