import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import logger from '../../../lib/Logging';
import { Input } from '@/components/UI/input';
import { Button } from '@/components/UI/button';

export default function CreatePasswordPad({ createPadAndOpen, callbackDone }) {
    const { t } = useTranslation('etherpad');

    const [padName, setPadName] = useState('');
    const [password, setPassword] = useState('');
    const [validatePassword, setValidatePassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createPasswordPad = async () => {
        setIsLoading(true);
        const createPad = await createPadAndOpen(padName, 'private', password)
            .catch(error => logger.debug(error));
        setIsLoading(false);
        if (!createPad) return;
        callbackDone && callbackDone();
        setPadName('');
    };

    return (<Form onSubmit={(e) => { e.preventDefault(); createPasswordPad(); }}>
        <Input type="text" placeholder={t('Name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
        <Input type="password" placeholder={t('Password')} value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input type="password" placeholder={t('Confirm password')} value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
        <Button type="submit" disabled={!padName || !password || password !== validatePassword}>{ isLoading ? <LoadingSpinnerInline inverted /> :t('Create pad') }</Button>
    </Form>);
}
