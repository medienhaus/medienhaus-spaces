import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardIcon } from '@remixicons/react/line';

import TextButton from './TextButton';

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
                <ClipboardIcon width="var(--icon-size)" height="var(--icon-size)" fill="var(--color-fg)" /> }
        </TextButton>
    );
};

export default CopyToClipboard;
