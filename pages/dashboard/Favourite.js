import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import _ from 'lodash';
import { RiDeleteBinLine } from '@remixicon/react';

import { ServiceTable } from '@/components/UI/ServiceTable';
import TextButton from '../../components/UI/TextButton';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import Icon from '../../components/UI/Icon';
import { useMatrix } from '@/lib/Matrix';
import { useAuth } from '@/lib/Auth';
import logger from '../../lib/Logging';

/**
 * Favourite component for rendering a single favourite entry.
 *
 * @param {string} roomId - The ID of the favourite room.
 * @param {Object} metaEvent - The meta event associated with the favourite.
 * @param {string} name - The name of the favourite room.
 * @param {number} index - The index of the favourite room in the favourites array.
 * @returns {JSX.Element} - A JSX element representing a single favourite entry.
 *
 */
const Favourite = ({ roomId, metaEvent, name }) => {
    const [removingFavourite, setRemovingFavourite] = useState(false);
    const { t } = useTranslation();
    const matrix = useMatrix();
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();

    /**
     * Get the origin of the favourite room.
     * If the favourite is of the type 'context', return '/explore'.
     * Otherwise, return the path of the auth provider. If the path is not found, return the template name.
     * If the favourite is not of the type 'context' and the template is not found, we can assume it's a chat room and return '/chat'.
     * @function
     * @param {Object} metaEvent - The meta event associated with the favourite.
     * @returns {*|string} - The origin of the favourite room.
     */
    const getOrigin = (metaEvent) => {
        if (metaEvent) {
            if (metaEvent.type === 'context') return '/explore';

            return getConfig().publicRuntimeConfig.authProviders[metaEvent?.template]?.path || metaEvent?.template;
        } else return '/chat';
    };

    const origin = getOrigin(metaEvent);
    const link = `${origin}/${roomId}`;

    const handleRemove = async (e) => {
        e.preventDefault();
        setRemovingFavourite(true);
        // Remove the favourite from the account data
        await matrixClient
            .setAccountData('dev.medienhaus.spaces.favourites', { favourites: _.without([...matrix.favourites], roomId) })
            .catch((error) => {
                //@TODO error handling
                logger.log(error);
            });

        setRemovingFavourite(false);
    };

    return (
        <ServiceTable.Row key={roomId}>
            <ServiceTable.Cell>{origin}</ServiceTable.Cell>
            <ServiceTable.Cell>
                <Link href={link}>{name}</Link>
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <CopyToClipboard content={`${location.hostname}${link}`} />
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <TextButton title={t('Remove favourite')} onClick={handleRemove}>
                    {removingFavourite ? (
                        <LoadingSpinnerInline />
                    ) : (
                        <Icon>
                            <RiDeleteBinLine />
                        </Icon>
                    )}
                </TextButton>
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
};

export default Favourite;
