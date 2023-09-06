import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

import Bookmark from '../../assets/icons/bookmark.svg';
import TextButton from './TextButton';
import { useMatrix } from '../../lib/Matrix';
import { useAuth } from '../../lib/Auth';

const AddBookmark = ({ name }) => {
    const [contentCopied, setContentCopied] = useState(false);
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation();
    const router = useRouter();

    const addBookmarkToMatrix = async () => {
        const link = location.href;
        // eslint-disable-next-line no-undef
        if (process.env.NODE_ENV === 'development') console.log('creating bookmark room for ' + name);
        const firstSlashIndex = router.route.indexOf('/');
        const secondSlashIndex = router.route.indexOf('/', firstSlashIndex + 1);
        const service = router.route.substring(0, secondSlashIndex);

        const room = await matrix.createRoom(name + ' in ' + service, false, '', 'invite', 'content', 'link');
        await auth.getAuthenticationProvider('matrix').addSpaceChild(matrix.serviceSpaces.bookmarks, room).catch(console.log);
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: link,
        }).catch(console.log);

        setContentCopied(true);
        await new Promise(r => setTimeout(r, 2000));
        setContentCopied(false);
    };

    return (
        <TextButton title={t('Add to bookmarks')} onClick={addBookmarkToMatrix}>
            { contentCopied ?
                '✔':
                <Bookmark fill="var(--color-foreground)" /> }
        </TextButton>
    );
};
export default AddBookmark;
