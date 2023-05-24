import { useTranslation } from 'react-i18next';

import IframeLayout from '../../components/layouts/iframe';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Bin from '../../assets/icons/bin.svg';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import AddBookmark from '../../components/UI/AddBookmark';

const WriteIframeHeader = ({ removingLink, removeLink, title, content }) => {
    const { t } = useTranslation('write');

    return (
        <IframeLayout.IframeHeader>
            <h2>{ title }</h2>
            <IframeLayout.IframeHeaderButtonWrapper>
                <CopyToClipboard content={content} />
                <AddBookmark name={title} />
                <button title={t('Remove pad from my library')} onClick={removeLink}>
                    { removingLink ? <LoadingSpinner /> : <Bin fill="var(--color-foreground)" /> }
                </button>
            </IframeLayout.IframeHeaderButtonWrapper>
        </IframeLayout.IframeHeader>
    );
};
export default WriteIframeHeader;
