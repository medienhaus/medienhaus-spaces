import { useTranslation } from 'react-i18next';

import { Button } from '@/components/UI/shadcn/Button';

/**
 * React Component which returns
 *
 * @param {Boolean} disabled disables both buttons if true
 * @param {function} onClick onClick function to execute when clicking 'next'
 * @param {function} onCancel function to execute when clicking 'previous'
 * @param {Boolean} disableNext disables 'next' button if true
 * @param {Boolean} disablePrev disables 'previous' button if true
 * @returns {React.JSX} two inline buttons.  'previous' and 'next'
 *
 */
const PreviousNextButtons = ({ children, disabled, onCancel, disableNext, disablePrev, previousLabel, nextLabel, warning }) => {
    const { t } = useTranslation();

    const handlePrevious = (e) => {
        //@TODO check type submit thing
        e.preventDefault();
        onCancel();
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="reset" disabled={disabled || disablePrev} onClick={handlePrevious}>
                {previousLabel || t('Previous')}
            </Button>
            <Button type="submit" variant={warning ? 'destructive' : 'default'} disabled={disabled || disableNext}>
                {nextLabel || children || t('Next')}
            </Button>
        </div>
    );
};

export default PreviousNextButtons;
