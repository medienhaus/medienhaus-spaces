import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

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

const ConfirmButton = styled.button`
  color: var(--color-background);
  background-color: var(--color-foreground);

  &:disabled {
    color: var(--color-background);
    background-color: var(--color-disabled);
  }

  &:hover {
    color: rgb(255 255 255);
    background-color: var(--color-notification);
    border-color: var(--color-notification);
    transition: all 200ms ease;
  }
`;

const CancelButton = styled.button`
  color: var(--color-foreground);
  background-color: var(--color-background);

  &:disabled {
    color: var(--color-disabled);
    background-color: var(--color-background);
  }

  &:hover {
    color: var(--color-notification);
    background-color: var(--color-background);
    border-color: var(--color-notification);
    transition: all 200ms ease;
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
            <CancelButton type="reset" disabled={disabled}>{ cancelLabel || t('Cancel') }</CancelButton>
            <ConfirmButton type="submit" disabled={disabled}>{ confirmLabel || t('Confirm') }</ConfirmButton>
        </Wrapper>
    );
};

export default ConfirmCancelButtons;
