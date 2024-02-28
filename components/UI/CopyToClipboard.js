import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiCheckLine, RiClipboardLine } from '@remixicon/react';

import Icon from './Icon';
import { Button } from '@/components/UI/shadcn/Button';

const CopyToClipboard = ({ content, title }) => {
    const [wasContentCopied, setWasContentCopied] = useState(false);
    const { t } = useTranslation();

    const copyToClipboard = async () => {
        navigator.clipboard.writeText(content);
        setWasContentCopied(true);
        await new Promise((r) => setTimeout(r, 2000));
        setWasContentCopied(false);
    };

    return (
        <Button variant="ghost" title={title || t('Copy link to clipboard')} onClick={copyToClipboard}>
            {wasContentCopied ? (
                <Icon>
                    <RiCheckLine />
                </Icon>
            ) : (
                <Icon>
                    <RiClipboardLine />
                </Icon>
            )}
        </Button>
    );
};

export default CopyToClipboard;
