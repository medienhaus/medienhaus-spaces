import { useTranslation } from 'react-i18next';

import { Button } from '@/components/UI/shadcn/Button';
import { Input } from '@/components/UI/shadcn/Input';

export default function PasswordInputButton({ placeholder, value, onChange, disabled, label }) {
    const { t } = useTranslation();

    return (
        <div className="flex w-full items-center space-x-2">
            <Input type="password" value={value} onChange={onChange} placeholder={placeholder} />
            <Button type="submit" disabled={disabled}>
                {label || t('Login')}
            </Button>
        </div>
    );
}
