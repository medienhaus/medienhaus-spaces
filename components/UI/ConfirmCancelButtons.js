import { useTranslation } from 'react-i18next';

import { Button } from '@/components/UI/shadcn/Button';

const ConfirmCancelButtons = ({ disabled, confirmLabel, cancelLabel, destructive, disableConfirm }) => {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="reset" disabled={disabled}>
                {cancelLabel || t('Cancel')}
            </Button>
            <Button type="submit" variant={destructive ? 'destructive' : 'default'} disabled={disabled || disableConfirm}>
                {confirmLabel || t('Confirm')}
            </Button>
        </div>
    );
};

export default ConfirmCancelButtons;
