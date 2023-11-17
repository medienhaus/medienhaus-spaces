import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import LoadingSpinnerInline from './LoadingSpinnerInline';

const LostConnectionView = styled.div`
  position: absolute;
  right: var(--margin);
  bottom: var(--margin);
  display: grid;
  grid-auto-flow: column;
  grid-gap: calc(var(--margin)/2);
  place-items: center;
  padding: calc(var(--margin)/2) var(--margin);
  color: white;
  text-transform: uppercase;
  background-color: var(--color-notification);
  border-radius: var(--border-radius);
`;

const LostConnection = () => {
    const { t } = useTranslation();

    return (
        <LostConnectionView>
            <small>
                { t('Connection lost') }
            </small>
            <LoadingSpinnerInline inverted />
        </LostConnectionView>
    );
};

export default LostConnection;
