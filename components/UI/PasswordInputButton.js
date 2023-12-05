import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import ButtonPrimary from './ButtonPrimary';
import Input from './Input';

const PasswordInputButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-gap: 0 calc(var(--margin) / var(--line-height));
  align-items: start;
`;

export default function PasswordInputButton({ placeholder, value, onChange, disabled, label }) {
    const { t } = useTranslation();

    return <PasswordInputButtonContainer>
        <Input type="password"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
        <ButtonPrimary type="submit" disabled={disabled}>{ label || t('Login') }</ButtonPrimary>
    </PasswordInputButtonContainer>;
}
