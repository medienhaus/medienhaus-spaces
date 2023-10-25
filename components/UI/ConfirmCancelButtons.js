import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const ConfirmCancelButtonsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: var(--margin);
`;

const ConfirmButton = styled.button`
  color: var(--color-background);
  background-color: var(--color-foreground);

  &:disabled {
    color: var(--color-background);
    background-color: var(--color-disabled);
  }
`;

const CancelButton = styled.button`
  color: var(--color-foreground);
  background-color: var(--color-background);

  &:disabled {
    color: var(--color-disabled);
    background-color: var(--color-background);
  }
`;

const ConfirmCancelButtons = ({ children, disabled, disableConfirm, disableCancel, onClick, onCancel }) => {
    const { t } = useTranslation();

    return (
        <ConfirmCancelButtonsWrapper>
            <ConfirmButton type="submit" disabled={disabled || disableConfirm} onClick={onClick}>{ children ? children : t('Confirm') }</ConfirmButton>
            <CancelButton type="reset" disabled={disabled || disableCancel} onClick={onCancel}>{ t('Cancel') }</CancelButton>
        </ConfirmCancelButtonsWrapper>
    );
};

export default ConfirmCancelButtons;
