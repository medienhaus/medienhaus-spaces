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
 * DisplayBookmarks component for rendering and managing bookmarks within a specified space.
 * This component displays a list of bookmarks, allowing users to remove them.
 *

 @param {string} bookmarkSpaceId - The ID of the space containing bookmarks.
 @param {string} name - the name of the origin of the bookmark.
 * @returns {JSX.Element|null} - A JSX element containing the list of bookmarks, or null if the space is not found.
 */

export default function DisplayBookmarks({ bookmarkObject, handleRemoveBookmark }) {
    const getOrigin = () => {
        if (bookmarkObject.meta) {
            //check if there is a path name defined for the template, otherwise return the template name
            if (bookmarkObject.meta.type === 'context') return '/explore';

            return getConfig().publicRuntimeConfig.authProviders[bookmarkObject.meta?.template]?.path || bookmarkObject.meta?.template;
        } else return '/chat';
    };

    return (
        <Bookmark
            key={bookmarkObject.roomId}
            roomId={bookmarkObject.roomId}
            link={`${getOrigin()}/${bookmarkObject.roomId}`}
            name={bookmarkObject.name}
            origin={getOrigin()}
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
 * @TODO
 * origin only works
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
                <CopyToClipboard content={link} />
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
