import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const PreviousNextButtonsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: var(--margin);
`;

const NextButton = styled.button`
  color: var(--color-background);
  background-color: var(--color-foreground);

  &:disabled {
    color: var(--color-background);
    background-color: var(--color-disabled);
  }
`;

const PreviousButton = styled.button`
  color: var(--color-foreground);
  background-color: var(--color-background);

  &:disabled {
    color: var(--color-disabled);
    background-color: var(--color-background);
  }
`;

const PreviousNextButtons = ({ children, disabled, onClick, onCancel }) => {
    const { t } = useTranslation();

    const handlePrevious = (e) => {
        //@TODO check type submit thing
        e.preventDefault();
        onCancel();
    };

    return (
        <PreviousNextButtonsWrapper>
            <PreviousButton type="button" disabled={disabled} onClick={handlePrevious}>{ t('Previous') }</PreviousButton>
            <NextButton type="submit" disabled={disabled}>{ children ? children : t('Next') }</NextButton>
        </PreviousNextButtonsWrapper>
    );
};

export default PreviousNextButtons;
