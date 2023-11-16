import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { DeleteBinIcon, FolderIcon, ListSettingsIcon, UserAddIcon, UserUnfollowIcon } from '@remixicons/react/line';
import React from 'react';

import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import TextButton from './TextButton';
import DefaultLayout from '../layouts/default';

const ToggleButton = styled.button`
  /* unset globally defined button styles; set height to line-height */
  width: unset;
  height: calc(var(--margin) * 1.3);
  padding: unset;
  background-color: unset;
  border: unset;
`;

const ServiceIframeHeader = ({ isDeletingPad, deleteContent, title, myPadsObject, content, myPowerLevel, setManageContextActionToggle, manageContextActionToggle, isInviteUsersOpen, setIsInviteUsersOpen }) => {
    const { t } = useTranslation('write');
    console.log(isInviteUsersOpen);

    return (
        <DefaultLayout.IframeHeader>
            <h2>{ title }</h2>
            <DefaultLayout.IframeHeaderButtonWrapper>
                <CopyToClipboard content={content} />
                { deleteContent && <TextButton title={t(myPadsObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deleteContent}>
                    { isDeletingPad ? <LoadingSpinnerInline /> : <DeleteBinIcon width="var(--icon-size)" height="var(--icon-size)" fill="var(--color-foreground)" /> }
                </TextButton> }
                <TextButton title={t('Invite users to' + ' ' + title)} onClick={setIsInviteUsersOpen}>
                    { isInviteUsersOpen ? <UserUnfollowIcon width="var(--icon-size)" height="var(--icon-size)" fill="var(--color-foreground)" /> : <UserAddIcon width="var(--icon-size)" height="var(--icon-size)" fill="var(--color-foreground)" /> }
                </TextButton>
                { myPowerLevel && (
                    manageContextActionToggle ? (
                        <ToggleButton onClick={() => { setManageContextActionToggle(false); }}>
                            <FolderIcon
                                width="var(--icon-size)"
                                height="var(--icon-size)"
                                title={t('Browse the selected context')}
                                fill="var(--color-foreground)"
                            />
                        </ToggleButton>
                    ) : (
                        <ToggleButton onClick={() => { setManageContextActionToggle(true); }}>
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
