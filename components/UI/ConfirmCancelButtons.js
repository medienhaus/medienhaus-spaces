import { styled } from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/UI/shadcn/button';

const ConfirmCancelButtonsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-gap: var(--margin);
`;

const SmallConfirmCancelButtonsWrapper = styled(ConfirmCancelButtonsWrapper)`
  width: fit-content;
`;

const ConfirmCancelButtons = ({ disabled, confirmLabel, cancelLabel, small }) => {
    const { t } = useTranslation();

    // We might want to use a special wrapper if we want to use a small version of this component
    const Wrapper = small
        ? SmallConfirmCancelButtonsWrapper
        : ConfirmCancelButtonsWrapper;

    return (
        <Wrapper>
            <Button variant="outline" type="reset" disabled={disabled}>{ cancelLabel || t('Cancel') }</Button>
            <Button variant="default" type="submit" disabled={disabled}>{ confirmLabel || t('Confirm') }</Button>
        </Wrapper>
    );
};

export default ConfirmCancelButtons;
