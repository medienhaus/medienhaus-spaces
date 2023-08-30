import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import LoadingSpinnerInline from './LoadingSpinnerInline';

const NoConnectionView = styled.div`
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
  background-color: #ff2f4f;
  border-radius: 4px;

`;
const LostConnection = () => {
    const { t } = useTranslation();

    return (
        <NoConnectionView>
            <small>
                { t('Waiting for server') }
            </small>
            <LoadingSpinnerInline inverted />
        </NoConnectionView>
    );
};

export default LostConnection;
