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

/**
 * React Component which returns
 *
 * @param {Boolean} disabled disables both buttons if true
 * @param {function} onClick onClick function to execute when clicking 'next'
 * @param {function} onCancel function to execute when clicking 'previous'
 * @param {Boolean} disableNext disables 'next' button if true
 * @param {Boolean} disablePrev disables 'previous' button if true
 * @returns {React.ReactComponent} two inline buttons.  'previous' and 'next'
 */
const PreviousNextButtons = ({children,  disabled, onCancel, disableNext, disablePrev }) => {
    const { t } = useTranslation();

    const handlePrevious = (e) => {
        //@TODO check type submit thing
        e.preventDefault();
        onCancel();
    };

    return (
        <PreviousNextButtonsWrapper>
            <PreviousButton type="button" disabled={disabled || disablePrev} onClick={handlePrevious}>{ t('Previous') }</PreviousButton>
            <NextButton type="submit" disabled={disabled || disableNext}> { children || t('Next') }</NextButton>
        </PreviousNextButtonsWrapper>
    );
};

export default PreviousNextButtons;
