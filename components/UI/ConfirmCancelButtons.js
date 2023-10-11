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
  color: ${props => props.warning ? 'var(--color-background)' : 'var(--color-foreground)'};
  ${props => props.warning && 'border-color: var(--color-notification);'}

  background-color: ${props => props.warning ? 'var(--color-notification)' : 'var(--color-background)'};

  &:disabled {
    color: var(--color-disabled);
    background-color: var(--color-background);
  }
`;

const ConfirmCancelButtons = ({ children, disabled, onClick, onCancel, cancelTitle }) => {
    const { t } = useTranslation();
    console.log(children);

    return (
        <ConfirmCancelButtonsWrapper>
            <ConfirmButton type="submit" disabled={disabled} onClick={onClick}>{ children ? children : t('Confirm') }</ConfirmButton>
            <CancelButton warning type="reset" disabled={disabled} onClick={onCancel}>{ cancelTitle || t('Cancel') }</CancelButton>
        </ConfirmCancelButtonsWrapper>
    );
};

export default ConfirmCancelButtons;
