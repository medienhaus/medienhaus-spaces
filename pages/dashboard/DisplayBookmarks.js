import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DeleteBinIcon } from '@remixicons/react/line';
import getConfig from 'next/config';

import { ServiceTable } from '../../components/UI/ServiceTable';
import TextButton from '../../components/UI/TextButton';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import Icon from '../../components/UI/Icon';

/**
 * Get the origin of the bookmarked room.
 * If the bookmark is of the type 'context', return '/explore'.
 * Otherwise, return the path of the auth provider. If the path is not found, return the template name.
 * If the bookmark is not of the type 'context' and the template is not found, we can assume it's a chat room and return '/chat'.
 * @function
 * @param {Object} bookmarkObject - The object containing the bookmark data from the matrix account data.
 * @returns {*|string} - The origin of the bookmarked room.
 */
const getOrigin = (bookmarkObject) => {
    if (bookmarkObject.meta) {
        if (bookmarkObject.meta.type === 'context') return '/explore';

        return getConfig().publicRuntimeConfig.authProviders[bookmarkObject.meta?.template]?.path || bookmarkObject.meta?.template;
    } else return '/chat';
};

/**
 * DisplayBookmarks component for rendering and managing bookmarks within a specified space.
 * This component displays a list of bookmarks, stored in the matrix account data, allowing users to remove them.
 *
 * @component
 * @param {string} bookmarkSpaceId - The ID of the space containing bookmarks.
 * @param {Object} bookmarkObject - The object containing the bookmark data from the matrix account data.
 * @param {Function} handleRemoveBookmark - A function to remove the bookmark.
 * @returns {JSX.Element|null} - A JSX element containing the list of bookmarks, or null if the space is not found.
 */

export default function DisplayBookmarks({ bookmarkObject, handleRemoveBookmark }) {
    const origin = getOrigin(bookmarkObject);

    return (
        <Bookmark
            key={bookmarkObject.roomId}
            roomId={bookmarkObject.roomId}
            link={`${origin}/${bookmarkObject.roomId}`}
            name={bookmarkObject.name}
            origin={origin}
            handleRemoveBookmark={handleRemoveBookmark}
        />
    );
}

/**
 * Bookmark component for rendering a single bookmark entry.
 *
 * @param {string} roomId - The ID of the bookmarked room.
 * @param {string} link - The link associated with the bookmark.
 * @param {string} name - The name of the bookmarked room.
 * @param {string} origin - The name of the origin of the bookmarked room.
 * @param {Function} handleRemoveBookmark - A function to remove the bookmark.
 * @returns {JSX.Element} - A JSX element representing a single bookmark entry.
 *
 */
const Bookmark = ({ roomId, link, name, origin, handleRemoveBookmark }) => {
    const [removingBookmark, setRemovingBookmark] = useState(false);
    const { t } = useTranslation();

    const handleRemove = async (e) => {
        e.preventDefault();
        setRemovingBookmark(true);
        await handleRemoveBookmark(roomId)
            .catch(error => alert(error.data?.error));
        setRemovingBookmark(false);
    };

    return (
        <ServiceTable.Row key={roomId}>
            <ServiceTable.Cell>
                { origin }
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <Link href={link}>{ name }</Link>
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <CopyToClipboard content={`${location.hostname}${link}`} />
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <TextButton title={t('Remove bookmark')} onClick={handleRemove}>
                    { removingBookmark ? <LoadingSpinnerInline /> : <Icon>
                        <DeleteBinIcon />
                    </Icon> }
                </TextButton></ServiceTable.Cell>
        </ServiceTable.Row>
    );
};
