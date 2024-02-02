import { styled } from 'styled-components';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { RiDeleteBinLine, RiFolderLine, RiListSettingsLine } from '@remixicon/react';

import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import TextButton from './TextButton';
import DefaultLayout from '../layouts/default';
import { InviteUserToMatrixRoom } from './InviteUsersToMatrixRoom';
import KnockOnMatrixRoom from './KnockOnMatrixRoom';
import AddFavourite from './favourites/AddFavourite';
import Icon from '@/components/UI/Icon';

const ToggleButton = styled.button`
    /* unset globally defined button styles; set height to line-height */
    width: unset;
    height: calc(var(--margin) * 1.3);
    padding: unset;
    background-color: unset;
    border: unset;
`;

// @TODO check if user actually has the needed power level to invite users to the matrix room
const ServiceIframeHeader = ({
    isDeletingPad,
    deleteContent,
    title,
    roomId,
    myPadsObject,
    content,
    myPowerLevel,
    setManageContextActionToggle,
    manageContextActionToggle,
    isInviteUsersOpen,
    setIsInviteUsersOpen,
    joinRule,
}) => {
    const { t } = useTranslation('write');

    return (
        <DefaultLayout.IframeHeader>
            <h2>{title}</h2>
            <DefaultLayout.IframeHeaderButtonWrapper>
                {joinRule === 'knock' || (joinRule === 'knock_restricted' && <KnockOnMatrixRoom roomId={roomId} roomName={title} />)}
                <CopyToClipboard content={content} />
                {deleteContent && (
                    <TextButton title={t(myPadsObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deleteContent}>
                        {isDeletingPad ? (
                            <LoadingSpinnerInline />
                        ) : (
                            <Icon>
                                <RiDeleteBinLine />
                            </Icon>
                        )}
                    </TextButton>
                )}
                {myPowerLevel && (
                    <InviteUserToMatrixRoom.Button
                        name={title}
                        onClick={() => {
                            if (manageContextActionToggle) setManageContextActionToggle(false);

                            setIsInviteUsersOpen((prevState) => !prevState);
                        }}
                        inviteUsersOpen={isInviteUsersOpen}
                    />
                )}
                <AddFavourite roomId={roomId} />
                {myPowerLevel &&
                    (manageContextActionToggle ? (
                        <ToggleButton
                            onClick={() => {
                                setManageContextActionToggle(false);
                            }}
                        >
                            <Icon>
                                <RiFolderLine />
                            </Icon>
                        </ToggleButton>
                    ) : (
                        <ToggleButton
                            onClick={() => {
                                if (isInviteUsersOpen) setIsInviteUsersOpen(false);
                                setManageContextActionToggle(true);
                            }}
                        >
                            <Icon>
                                <RiListSettingsLine />
                            </Icon>
                        </ToggleButton>
                    ))}
            </DefaultLayout.IframeHeaderButtonWrapper>
        </DefaultLayout.IframeHeader>
    );
};

export default ServiceIframeHeader;
