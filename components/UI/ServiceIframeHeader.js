import { useTranslation } from 'react-i18next';
import React from 'react';
import { RiDeleteBinLine } from '@remixicon/react';

import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import TextButton from './TextButton';
import DefaultLayout from '../layouts/default';
import KnockOnMatrixRoom from './KnockOnMatrixRoom';
import AddFavourite from './favourites/AddFavourite';
import Icon from '@/components/UI/Icon';

const ServiceIframeHeader = ({ isDeletingPad, deleteContent, title, roomId, myPadsObject, content, joinRule, roomName }) => {
    const { t } = useTranslation(['explore', 'etherpad']);

    return (
        <DefaultLayout.IframeHeader>
            <>{title}</>
            <DefaultLayout.IframeHeaderButtonWrapper>
                {joinRule === 'knock' || (joinRule === 'knock_restricted' && <KnockOnMatrixRoom roomId={roomId} roomName={roomName} />)}

                <CopyToClipboard content={content} />

                {deleteContent && (
                    <TextButton
                        title={myPadsObject ? t('Delete pad', { ns: 'etherpad' }) : t('Remove pad from my library', { ns: 'etherpad' })}
                        onClick={deleteContent}
                    >
                        {isDeletingPad ? (
                            <LoadingSpinnerInline />
                        ) : (
                            <Icon>
                                <RiDeleteBinLine />
                            </Icon>
                        )}
                    </TextButton>
                )}

                <AddFavourite roomId={roomId} />
            </DefaultLayout.IframeHeaderButtonWrapper>
        </DefaultLayout.IframeHeader>
    );
};

export default ServiceIframeHeader;
