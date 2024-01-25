import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DeleteBinIcon } from '@remixicons/react/line';
import getConfig from 'next/config';
import _ from 'lodash';

import { ServiceTable } from '../../components/UI/ServiceTable';
import TextButton from '../../components/UI/TextButton';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import Icon from '../../components/UI/Icon';
import { useMatrix } from '../../lib/Matrix';
import { useAuth } from '../../lib/Auth';

/**
 * Bookmark component for rendering a single bookmark entry.
 *
 * @param {string} roomId - The ID of the bookmarked room.
 * @param {Object} metaEvent - The meta event associated with the bookmark.
 * @param {string} name - The name of the bookmarked room.
 * @param {number} index - The index of the bookmarked room in the bookmarks array.
 * @returns {JSX.Element} - A JSX element representing a single bookmark entry.
 *
 */
const Bookmark =({ roomId, metaEvent, name }) => {
    const [removingBookmark, setRemovingBookmark] = useState(false);
    const { t } = useTranslation();
    const matrix = useMatrix();
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();

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

    const origin = getOrigin(metaEvent);
    const link=`${origin}/${roomId}`;

    const handleRemove = async (e) => {
        e.preventDefault();
        setRemovingBookmark(true);
        // Remove the bookmark from the account data
        await matrixClient.setAccountData('dev.medienhaus.spaces.bookmarks', { bookmarks: _.without([...matrix.bookmarks], roomId) })
            .catch((error) => {
                //@TODO error handling
                console.log(error);
            });

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
