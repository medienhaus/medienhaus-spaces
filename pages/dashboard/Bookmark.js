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
 * @param {Object} metaEvent - The meta event associated with the bookmark.
 * @returns {*|string} - The origin of the bookmarked room.
 */
const getOrigin = (metaEvent) => {
    if (metaEvent) {
        if (metaEvent.type === 'context') return '/explore';

        return getConfig().publicRuntimeConfig.authProviders[metaEvent?.template]?.path || metaEvent?.template;
    } else return '/chat';
};

/**
 * Bookmark component for rendering a single bookmark entry.
 *
 * @param {string} roomId - The ID of the bookmarked room.
 * @param {Object} metaEvent - The meta event associated with the bookmark.
 * @param {string} name - The name of the bookmarked room.
 * @param {Function} handleRemoveBookmark - A function to remove the bookmark.
 * @returns {JSX.Element} - A JSX element representing a single bookmark entry.
 *
 */
const Bookmark =({ roomId, metaEvent, name, handleRemoveBookmark }) => {
    const [removingBookmark, setRemovingBookmark] = useState(false);
    const origin = getOrigin(metaEvent);
    const link=`${origin}/${roomId}`;
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

export default Bookmark;
