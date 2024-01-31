import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, ClipboardIcon } from '@remixicons/react/line';
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
            { wasContentCopied ?
                <Icon>
                    <CheckIcon />
                </Icon>
                :
                <Icon>
                    <ClipboardIcon />
                </Icon>
            }
        </TextButton>
    );
};

export default CopyToClipboard;
