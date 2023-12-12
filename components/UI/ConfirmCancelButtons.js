import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import ButtonPrimary from './buttons/ButtonPrimary';
import ButtonSecondary from './buttons/ButtonSecondary';

const ConfirmCancelButtonsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: var(--margin);
`;

const SmallConfirmCancelButtonsWrapper = styled(ConfirmCancelButtonsWrapper)`
  width: fit-content;

  button {
    height: var(--line-height);
    padding: calc(var(--margin) * 0.1) calc(var(--margin) * 0.35);
    font-size: 80%;
    border-width: calc(var(--margin) * 0.125);
  }

  button[type='reset'] {
    font-weight: 600;
  }
`;

const ConfirmCancelButtons = ({ disabled, confirmLabel, cancelLabel, small }) => {
    const { t } = useTranslation();

    // We might want to use a special wrapper if we want to use a small version of this component
    const Wrapper = small
        ? SmallConfirmCancelButtonsWrapper
        : ConfirmCancelButtonsWrapper;

    return (
        <Wrapper>
            <ButtonSecondary type="reset" disabled={disabled}>{ cancelLabel || t('Cancel') }</ButtonSecondary>
            <ButtonPrimary type="submit" disabled={disabled}>{ confirmLabel || t('Confirm') }</ButtonPrimary>
        </Wrapper>
    );
};

export default ConfirmCancelButtons;
