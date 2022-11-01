import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Clipboard from '../../assets/icons/clipboard.svg';
import TextButton from './TextButton';

const CopyToClipboard = ({ content }) => {
    const [contentCopied, setContentCopied] = useState(false);
    const { t } = useTranslation();

    const copyToClipboard = async () => {
        navigator.clipboard.writeText(content);
        setContentCopied(true);
        await new Promise(r => setTimeout(r, 2000));
        setContentCopied(false);
    };

    return (
        <TextButton title={t('Copy link to clipboard')} onClick={copyToClipboard}>
            { contentCopied ?
                '✓':
                <Clipboard fill="var(--color-fg)" /> }
        </TextButton>
    );
};
export default CopyToClipboard;
