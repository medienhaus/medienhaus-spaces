import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, ClipboardIcon } from '@remixicons/react/line';

import ButtonInline from './buttons/ButtonInline';
import Icon from './Icon';

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
        <ButtonInline title={title || t('Copy link to clipboard')} onClick={copyToClipboard}>
            { wasContentCopied ?
                <Icon>
                    <CheckIcon />
                </Icon>
                :
                <Icon>
                    <ClipboardIcon />
                </Icon>
            }
        </ButtonInline>
    );
};

export default CopyToClipboard;
