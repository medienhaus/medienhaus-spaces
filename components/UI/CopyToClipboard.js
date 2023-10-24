import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import TextButton from './TextButton';
import { ClipboardIcon } from '@remixicons/react/line';

const CopyToClipboard = ({ content, title }) => {
    const [wasContentCopied, setWasContentCopied] = useState(false);
    const { t } = useTranslation();

    const copyToClipboard = async () => {
        navigator.clipboard.writeText(content);
        setWasContentCopied(true);
        await new Promise(r => setTimeout(r, 2000));
        setWasContentCopied(false);
    };

    return (
        <TextButton title={title || t('Copy link to clipboard')} onClick={copyToClipboard}>
            { wasContentCopied ?
                '✓':
                <ClipboardIcon width="24" height="24" fill="var(--color-fg)" /> }
        </TextButton>
    );
};
export default CopyToClipboard;
