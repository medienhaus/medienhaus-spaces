import { useTranslation } from 'react-i18next';

import IframeLayout from '../../components/layouts/iframe';
import BinIcon from '../../assets/icons/bin.svg';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import ListSettingsIcon from '../../assets/icons/list-settings.svg';

const ServiceIframeHeader = ({ isDeletingPad, deletePad, title, mypadsPadObject, content, hasManageContextActionRights, setManageContextActionToggle }) => {
    const { t } = useTranslation('write');

    return (
        <IframeLayout.IframeHeader>
            <h2>{ title }</h2>
            <IframeLayout.IframeHeaderButtonWrapper>
                <CopyToClipboard content={content} />
                <button title={t(mypadsPadObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deletePad}>
                    { isDeletingPad ? <LoadingSpinnerInline /> : <BinIcon fill="var(--color-foreground)" /> }
                </button>
                { hasManageContextActionRights && <button>
                    <ListSettingsIcon
                        title={t('Manage the selected context')}
                        fill="var(--color-foreground)"
                        onClick={() => setManageContextActionToggle(prevState => !prevState)}
                    />
                </button> }
            </IframeLayout.IframeHeaderButtonWrapper>
        </IframeLayout.IframeHeader>
    );
};
export default ServiceIframeHeader;
