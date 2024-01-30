import { styled } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { DeleteBinIcon, FolderIcon, ListSettingsIcon } from '@remixicons/react/line';
import React from 'react';

import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import TextButton from './TextButton';
import DefaultLayout from '../layouts/default';
import { InviteUserToMatrixRoom } from './InviteUsersToMatrixRoom';
import KnockOnMatrixRoom from './KnockOnMatrixRoom';

const ToggleButton = styled.button`
  /* unset globally defined button styles; set height to line-height */
  width: unset;
  height: calc(var(--margin) * 1.3);
  padding: unset;
  background-color: unset;
  border: unset;
`;

// @TODO check if user actually has the needed power level to invite users to the matrix room
const ServiceIframeHeader = ({ isDeletingPad, deleteContent, title, roomId, myPadsObject, content, myPowerLevel, setManageContextActionToggle, manageContextActionToggle, isInviteUsersOpen, setIsInviteUsersOpen, joinRule }) => {
    const { t } = useTranslation('write');

    return (
        <DefaultLayout.IframeHeader>
            <h2>{ title }</h2>
            <DefaultLayout.IframeHeaderButtonWrapper>
                { joinRule === 'knock' || joinRule === 'knock_restricted' && <KnockOnMatrixRoom roomId={roomId} roomName={title} /> }
                <CopyToClipboard content={content} />
                { deleteContent && <TextButton title={t(myPadsObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deleteContent}>
                    { isDeletingPad ? <LoadingSpinnerInline /> : <DeleteBinIcon width="var(--icon-size)" height="var(--icon-size)" fill="var(--color-foreground)" /> }
                </TextButton> }
                { myPowerLevel && <InviteUserToMatrixRoom.Button
                    name={title}
                    onClick={() => {
                        if (manageContextActionToggle) setManageContextActionToggle(false);

                        setIsInviteUsersOpen(prevState => !prevState);
                    }}
                    inviteUsersOpen={isInviteUsersOpen} /> }
                { myPowerLevel && (
                    manageContextActionToggle ? (
                        <ToggleButton onClick={() => {
                            setManageContextActionToggle(false);
                        }}>
                            <FolderIcon
                                width="var(--icon-size)"
                                height="var(--icon-size)"
                                title={t('Browse the selected context')}
                                fill="var(--color-foreground)"
                            />
                        </ToggleButton>
                    ) : (
                        <ToggleButton onClick={() => {
                            if (isInviteUsersOpen) setIsInviteUsersOpen(false);
                            setManageContextActionToggle(true);
                        }}>
                            <ListSettingsIcon
                                width="var(--icon-size)"
                                height="var(--icon-size)"
                                title={t('Manage the selected context')}
                                fill="var(--color-foreground)"
                            />
                        </ToggleButton>

                    )
                ) }
            </DefaultLayout.IframeHeaderButtonWrapper>
        </DefaultLayout.IframeHeader>
    );
};

export default ServiceIframeHeader;
