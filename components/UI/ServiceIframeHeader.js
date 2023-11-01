import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { DeleteBinIcon, FolderIcon, ListSettingsIcon } from '@remixicons/react/line';

import IframeLayout from '../../components/layouts/iframe';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import InviteUsersToMatrixRoom from './InviteUsersToMatrixRoom';

const ToggleButton = styled.button`
  /* unset globally defined button styles; set height to line-height */
  width: unset;
  height: calc(var(--margin) * 1.3);
  padding: unset;
  background-color: unset;
  border: unset;
`;

const ServiceIframeHeader = ({ isDeletingPad, deleteContent, title, roomId, myPadsObject, content, myPowerLevel, setManageContextActionToggle, manageContextActionToggle }) => {
    const { t } = useTranslation('write');

    return (
        <IframeLayout.IframeHeader>
            <h2>{ title }</h2>
            <IframeLayout.IframeHeaderButtonWrapper>
                <CopyToClipboard content={content} />
                { deleteContent && <button title={t(myPadsObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deleteContent}>
                    { isDeletingPad ? <LoadingSpinnerInline /> : <DeleteBinIcon width="24px" height="24px" fill="var(--color-foreground)" /> }
                </button> }
                <InviteUsersToMatrixRoom roomId={roomId} name={title} />
                { myPowerLevel && (
                    manageContextActionToggle ? (
                        <ToggleButton onClick={() => { setManageContextActionToggle(false); }}>
                            <FolderIcon
                                width="24px"
                                height="24px"
                                title={t('Browse the selected context')}
                                fill="var(--color-foreground)"
                            />
                        </ToggleButton>
                    ) : (
                        <ToggleButton onClick={() => { setManageContextActionToggle(true); }}>
                            <ListSettingsIcon
                                width="24px"
                                height="24px"
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
