import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import Clipboard from '../assets/icons/clipboard.svg';
import LoadingSpinner from './UI/LoadingSpinner';
import TextButton from './UI/TextButton';

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const Utilities = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .group {
    display: flex;
  }
`;

const FrameView = ({ link, title, onClose }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);

    return (<>
        <Utilities>
            <TextButton onClick={onClose}>←</TextButton>
            <div className="group">
                <TextButton title={t('Copy pad link to clipboard')} onClick={() => navigator.clipboard.writeText(link)}><Clipboard fill="var(--color-fg)" /></TextButton>
                <a href={link} title={t('Open in new tab')} target="_blank">↗</a>
            </div>
        </Utilities>
        <Container>
            { loading &&
                <LoadingSpinner />
            }
            <iframe src={link} title={title} style={{ display: loading && 'none' }} width="100%" height="100%" frameBorder="0" onLoad={() => setLoading(false)} />
        </Container>
    </>
    );
};

export default FrameView;
