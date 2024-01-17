import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
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
    const [currentService, setCurrentService] = useState('');
    const [bookmarkSpace, setBookmarkSpace] = useState('');
    const [bookmarkExists, setBookmarkExists] = useState(false);

    useEffect(() => {
        const checkExistingBookmarks = () => {
            // first we find out which service we're currently using
            const firstSlashIndex = router.route.indexOf('/');
            const secondSlashIndex = router.route.indexOf('/', firstSlashIndex + 1);
            const service = router.route.substring(1, secondSlashIndex);
            setCurrentService(service);
            const allBookmarks = matrix.spaces.get(matrix.serviceSpaces.bookmarks).children;

            // then we check if the service already has a bookmark space
            return allBookmarks.find(bookmark => matrix.spaces.get(bookmark)?.name === service);
        };

        matrix.serviceSpaces.bookmarks && setBookmarkSpace(checkExistingBookmarks());
    }, [matrix.serviceSpaces.bookmarks, matrix.spaces, router.route]);

    useEffect(() => {
        // we check if the selected roomId is already bookmarked
        bookmarkSpace && setBookmarkExists(matrix.spaces.get(bookmarkSpace).children.some(child => matrix.rooms.get(child)?.name === name));
    }, [bookmarkSpace, matrix.rooms, matrix.spaces, name]);

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
        const getBookmarkRoomId = async () => {
            if (bookmarkSpace) return bookmarkSpace;

            // if there is no bookmark space for the service yet, we create one
            const newBookmarkSpace = await matrix.createRoom(currentService, true, '', 'invite', 'content', 'link')
                .catch(() => {
                    errorHandling();

                    return;
                });
                // and add it to the bookmarks space
            await auth.getAuthenticationProvider('matrix')
                .addSpaceChild(matrix.serviceSpaces.bookmarks, newBookmarkSpace)
                .catch(() => {
                    errorHandling();

                    return;
                });

            return newBookmarkSpace;
        };

        const bookmarkRoomId = await getBookmarkRoomId();

        // we create a room for the bookmark
        const room = await matrix.createRoom(name, false, '', 'invite', 'content', 'link')
            .catch(() => {
                errorHandling();

                return;
            });
        // and add it to the bookmark space
        await auth.getAuthenticationProvider('matrix')
            .addSpaceChild(bookmarkRoomId, room)
            .catch(() => {
                errorHandling();

                return;
            });
        // then send the link of the bookmark as a message to the room
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: location.href,
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
        <TextButton disabled={bookmarkExists} title={t('Add to bookmarks')} onClick={addBookmarkToMatrix}>
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
