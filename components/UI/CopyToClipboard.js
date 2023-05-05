import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Clipboard from '../../assets/icons/clipboard.svg';
import TextButton from './TextButton';

const CopyToClipboard = ({ content, title }) => {
    const [isContentCopied, setIsContentCopied] = useState(false);
    const { t } = useTranslation();

    const copyToClipboard = async () => {
        navigator.clipboard.writeText(content);
        setIsContentCopied(true);
        await new Promise(r => setTimeout(r, 2000));
        setIsContentCopied(false);
    };

    return (
        <TextButton title={ title || t('Copy link to clipboard')} onClick={copyToClipboard}>
            { isContentCopied ?
                '✓':
                <Clipboard fill="var(--color-fg)" /> }
        </TextButton>
    );
};
export default CopyToClipboard;
