import { useTranslation } from 'react-i18next';
import React from 'react';
// import React, { useState } from 'react';
import { RiDeleteBinLine, RiFolderLine, RiGroupLine, RiListSettingsLine, RiUserAddLine } from '@remixicon/react';

import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import TextButton from './TextButton';
import DefaultLayout from '../layouts/default';
import KnockOnMatrixRoom from './KnockOnMatrixRoom';
import AddFavourite from './favourites/AddFavourite';
import Icon from '@/components/UI/Icon';
// import ExploreMatrixActions from '../../pages/explore/manage-room/ExploreMatrixActions';
import { Separator } from '@/components/UI/shadcn/Separator';
import { InviteUserToMatrixRoom } from './InviteUsersToMatrixRoom';

/*
const ToggleButton = styled.button`
    width: unset;
    height: calc(var(--margin) * 1.3);
    padding: unset;
    background-color: unset;
    border: unset;
`;
*/

// @TODO check if user actually has the needed power level to invite users to the matrix room
const ServiceIframeHeader = ({
    isDeletingPad,
    deleteContent,
    title,
    roomId,
    myPadsObject,
    content,
    myPowerLevel,
    manageContextActionToggle,
    setManageContextActionToggle,
    joinRule,
    // isInviteUsersOpen,
    // setIsInviteUsersOpen,
    // setSettingsTabValue,
}) => {
    const { t } = useTranslation(['explore', 'etherpad']);

    // const [settingsTabValue, setSettingsTabValue] = useState('settings');

    return (
        <DefaultLayout.IframeHeader>
            <h2>{title}</h2>
            <DefaultLayout.IframeHeaderButtonWrapper>
                {joinRule === 'knock' || (joinRule === 'knock_restricted' && <KnockOnMatrixRoom roomId={roomId} roomName={title} />)}
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
