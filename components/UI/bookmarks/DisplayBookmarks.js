import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { useMatrix } from '../../../lib/Matrix';
import { ServiceTable } from '../../../components/UI/ServiceTable';
import { useAuth } from '../../../lib/Auth';
import Bin from '../../../assets/icons/bin.svg';
import TextButton from '../../../components/UI/TextButton';
import LoadingSpinnerInline from '../LoadingSpinnerInline';

/**
 * DisplayBookmarks component for rendering and managing bookmarks within a specified space.
 * This component displays a list of bookmarks, allowing users to remove them.
 *
 * @param {string} bookmarkSpaceId - The ID of the space containing bookmarks.
 * @returns {JSX.Element|null} - A JSX element containing the list of bookmarks, or null if the space is not found.
 */

export default function DisplayBookmarks({ bookmarkSpaceId }) {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const allBookmarkIds = matrix.spaces.get(bookmarkSpaceId)?.children;
    const { t } = useTranslation();

    const removeBookmark = async (parent, roomId) => {
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(parent, roomId);
        await matrix.leaveRoom(roomId);
    };

    if (!matrix.spaces.get(bookmarkSpaceId)) return null;

    return (
        <>
            { allBookmarkIds.length > 0 && <h2>{ t('Bookmarks') }</h2> }
            <ServiceTable>
                { matrix.spaces.get(bookmarkSpaceId)?.children.map(roomId => {
                    return <Bookmark
                        parent={bookmarkSpaceId}
                        roomId={roomId}
                        link={matrix.roomContents.get(roomId).body}
                        name={matrix.rooms.get(roomId).name}
                        removeBookmark={removeBookmark}
                    />;
                })
                }
            </ServiceTable>
        </>);
}
/**
 * Bookmark component for rendering a single bookmark entry.
 *
 * @param {string} parent - The ID of the parent space.
 * @param {string} roomId - The ID of the bookmarked room.
 * @param {string} link - The link associated with the bookmark.
 * @param {string} name - The name of the bookmarked room.
 * @param {Function} removeBookmark - A function to remove the bookmark.
 * @returns {JSX.Element} - A JSX element representing a single bookmark entry.
 *
 * @TODO
 * origin only works
 */
const Bookmark = ({ parent, roomId, link, name, removeBookmark }) => {
    const [removingBookmark, setRemovingBookmark] = useState(false);
    const { t } = useTranslation();
    // grab the origin of the bookmark. This expression returns the string from the end of the top level domain until the beginning of the room id
    const match = link.match(/:\/\/[^/]+(\/.*?)\/![^/]+/);
    // Check if a match was found and get the desired string
    const origin = match ? match[1] : null;

    const handleRemove = async (e) => {
        e.preventDefault();
        setRemovingBookmark(true);
        await removeBookmark(parent, roomId)
            .catch(error => alert(error.data?.error));
        setRemovingBookmark(false);
    };

    return (
        <ServiceTable.Row key={roomId}>
            <ServiceTable.Cell>
                <Link href={link}>{ name } { t('from') } { origin }</Link>
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <TextButton title={t('Remove bookmark')} onClick={handleRemove}>
                    { removingBookmark ? <LoadingSpinnerInline /> : <Bin fill="var(--color-foreground)" /> }
                </TextButton></ServiceTable.Cell>
        </ServiceTable.Row>
    );
};
