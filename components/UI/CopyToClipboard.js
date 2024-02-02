import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiCheckLine, RiClipboardLine } from '@remixicon/react';
import _ from 'lodash';

import Icon from './Icon';
import TextButton from './TextButton';

const CopyToClipboard = ({ content, title }) => {
    const [wasContentCopied, setWasContentCopied] = useState(false);
    const { t } = useTranslation();

    const copyToClipboard = async () => {
        navigator.clipboard.writeText(content);
        setWasContentCopied(true);
        _.delay(() => setWasContentCopied(false), 2500);
    };

    return (
        <TextButton title={title || t('Copy link to clipboard')} onClick={copyToClipboard}>
            {wasContentCopied ? (
                <Icon>
                    <RiCheckLine />
                </Icon>
            ) : (
                <Icon>
                    <RiClipboardLine />
                </Icon>
            )}
        </TextButton>
    );
};

export default CopyToClipboard;
