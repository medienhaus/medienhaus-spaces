import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/UI/shadcn/Button';

const PreviousNextButtonsWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: var(--margin);
    width: 55ch;

    &:not(:first-child) {
        margin-top: var(--margin);
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
 * @returns {React.JSX} two inline buttons.  'previous' and 'next'
 */
const PreviousNextButtons = ({ children, disabled, onCancel, disableNext, disablePrev, warning }) => {
    const { t } = useTranslation();

    const handlePrevious = (e) => {
        //@TODO check type submit thing
        e.preventDefault();
        onCancel();
    };

    return (
        <PreviousNextButtonsWrapper>
            <Button variant="outline" type="reset" disabled={disabled || disablePrev} onClick={handlePrevious}>
                {t('Previous')}
            </Button>
            <Button type="submit" variant={warning ? 'destructive' : 'default'} disabled={disabled || disableNext}>
                {children || t('Next')}
            </Button>
        </PreviousNextButtonsWrapper>
    );
};

export default PreviousNextButtons;
