import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { RiStarFill, RiStarLine } from '@remixicon/react';

import TextButton from '../TextButton';
import { useMatrix } from '@/lib/Matrix';
import { useAuth } from '@/lib/Auth';
import Icon from '../Icon';
import logger from '@/lib/Logging';
import LoadingSpinner from '../LoadingSpinner';

/**
 * AddFavourite component for adding a favourite to the matrix account data.
 * This component displays a button that allows users to add a favourite to the matrix account data.
 * The button is disabled if the favourite already exists.
 * @component
 * @param {string} roomId - The id of the room to add to the favourites.
 * @returns {JSX.Element} - A JSX element containing the button to add a favourite.
 */
const AddFavourite = ({ roomId }) => {
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation();
    const [isHandlingFavourite, setIsHandlingFavourite] = useState(false);
    const favourites = matrix.favourites;
    const isFavourite = favourites?.includes(roomId);

    const addFavouriteToMatrix = async () => {
        setIsHandlingFavourite(true);

        const accountData = { favourites: favourites || [] };
        accountData.favourites.push(roomId);

        await matrixClient.setAccountData('dev.medienhaus.spaces.favourites', accountData).catch((error) => {
            alert(error.data?.error);
        });
        setIsHandlingFavourite(false);
    };

    const removeFavouriteFromMatrix = async (e) => {
        e.preventDefault();
        setIsHandlingFavourite(true);
        // Remove the favourite from the account data
        await matrixClient
            .setAccountData('dev.medienhaus.spaces.favourites', { favourites: _.without([...matrix.favourites], roomId) })
            .catch((error) => {
                //@TODO error handling
                logger.log(error);
            });

        setIsHandlingFavourite(false);
    };

    return (
        <TextButton
            title={isFavourite ? t('Remove from favourites') : t('Add to favourites')}
            onClick={isFavourite ? removeFavouriteFromMatrix : addFavouriteToMatrix}
        >
            {isHandlingFavourite ? (
                <Icon>
                    <LoadingSpinner className="mx-auto max-h-[16px] max-w-[16px] !border-[2px]" />
                </Icon>
            ) : isFavourite ? (
                <Icon>
                    <RiStarFill />
                </Icon>
            ) : (
                <Icon>
                    <RiStarLine />
                </Icon>
            )}
        </TextButton>
    );
};

export default AddFavourite;
