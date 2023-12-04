import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import ButtonPrimary from './ButtonPrimary';

const PasswordInputButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-gap: 0 calc(var(--margin) / var(--line-height));
  align-items: start;

  /* make button child element the same height as input child element *
   * NOTE: input height is styled globally via /assets/_globalCss.css */
  > * {
    height: 100%;
  }

  /* NOTE: once input elements are no longer styled globally, we could *
   * set the container height, and change the selector as done below … *

  height: calc(1rem * var(--line-height) * 4);

  > input,
  > button {
    height: 100%;
  }
  */
`;

export default function PasswordInputButton({ placeholder, value, onChange, disabled, label }) {
    const { t } = useTranslation();

    return <PasswordInputButtonContainer>
        <input type="password"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
        <ButtonPrimary type="submit" disabled={disabled}>{ label || t('Login') }</ButtonPrimary>
    </PasswordInputButtonContainer>;
}
