import styled from 'styled-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import IframeLayout from '../../components/layouts/iframe';
import BinIcon from '../../assets/icons/bin.svg';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import FolderIcon from '../../assets/icons/folder.svg';
import ListSettingsIcon from '../../assets/icons/list-settings.svg';
import InviteUsersToMatrixRoom from './InviteUsersToMatrixRoom';

const ToggleButton = styled.button`
  /* unset globally defined button styles; set height to line-height */
  width: unset;
  height: calc(var(--margin) * 1.3);
  padding: unset;
  background-color: unset;
  border: unset;
`;

const ServiceIframeHeader = ({ isDeletingPad, deleteContent, title, roomId, mypadsPadObject, content, isCurrentUserModerator, setManageContextActionToggle, manageContextActionToggle }) => {
    const { t } = useTranslation('write');

    return (
        <IframeLayout.IframeHeader>
            <h2>{ title }</h2>
            <IframeLayout.IframeHeaderButtonWrapper>
                <CopyToClipboard content={content} />
                { deleteContent && <button title={t(mypadsPadObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deleteContent}>
                    { isDeletingPad ? <LoadingSpinnerInline /> : <BinIcon fill="var(--color-foreground)" /> }
                </button> }
                <InviteUsersToMatrixRoom roomId={roomId} name={title} />
                { isCurrentUserModerator && (
                    manageContextActionToggle ? (
                        <ToggleButton onClick={() => { setManageContextActionToggle(false); }}>
                            <FolderIcon
                                title={t('Browse the selected context')}
                                fill="var(--color-foreground)"
                            />
                        </ToggleButton>
                    ) : (
                        <ToggleButton onClick={() => { setManageContextActionToggle(true); }}>
                            <ListSettingsIcon
                                title={t('Manage the selected context')}
                                fill="var(--color-foreground)"
                            />
                        </ToggleButton>

                    )
                ) }
            </IframeLayout.IframeHeaderButtonWrapper>
        </IframeLayout.IframeHeader>
    );
};
export default ServiceIframeHeader;
