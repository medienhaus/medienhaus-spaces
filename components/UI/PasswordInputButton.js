import { styled } from 'styled-components';
import { useTranslation } from 'react-i18next';

const PasswordInputButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-gap: 0 calc(var(--margin) / var(--line-height));
  align-items: start;

  /* it might work, but i really don’t like it */
  & > * {
    margin-top: unset;
  }
`;

export default function PasswordInputButton({ placeholder, value, onChange, disabled, label }) {
    const { t } = useTranslation();

    return <PasswordInputButtonContainer>
        <input type="password"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
        <button type="submit" disabled={disabled}>{ label || t('Login') }</button>
    </PasswordInputButtonContainer>;
}
