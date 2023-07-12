import { useTranslation } from 'react-i18next';

import IframeLayout from '../../components/layouts/iframe';
import BinIcon from '../../assets/icons/bin.svg';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

const WriteIframeHeader = ({ isDeletingPad, deletePad, title, mypadsPadObject }) => {
    const { t } = useTranslation('write');

    return (
        <IframeLayout.IframeHeader>
            <h2>{ title }</h2>
            <IframeLayout.IframeHeaderButtonWrapper>
                <CopyToClipboard content={content} />
                <button title={t(mypadsPadObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deletePad}>
                    { isDeletingPad ? <LoadingSpinnerInline /> : <BinIcon fill="var(--color-foreground)" /> }
                </button>
            </IframeLayout.IframeHeaderButtonWrapper>
        </IframeLayout.IframeHeader>
    );
};
export default WriteIframeHeader;
