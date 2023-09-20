import { useState } from 'react';
import { useRouter } from 'next/router';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';

import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { useAuth } from '../../../lib/Auth';

export default function CreatePasswordPad({ callbackDone, createWriteRoom }) {
    const router = useRouter();
    const { t } = useTranslation('etherpad');

    const auth = useAuth();
    const etherpad = auth.getAuthenticationProvider('etherpad');

    const [padName, setPadName] = useState('');
    const [password, setPassword] = useState('');
    const [validatePassword, setValidatePassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createPasswordPad = async () => {
        setIsLoading(true);
        const padId = await etherpad.createPad(padName, 'private', password);
        const link = getConfig().publicRuntimeConfig.authProviders.etherpad.baseUrl + '/' + padId;
        const roomId = await createWriteRoom(link, padName);
        router.push(`/${getConfig().publicRuntimeConfig.authProviders.etherpad.path}/${roomId}`);

        callbackDone && callbackDone();
        setPadName('');
        setIsLoading(false);
    };

    return (<Form onSubmit={(e) => { e.preventDefault(); createPasswordPad(); }}>
        <input type="text" placeholder={t('Name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
        <input type="password" placeholder={t('Password')} value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="password" placeholder={t('Confirm password')} value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
        <button type="submit" disabled={!padName || !password || password !== validatePassword}>{ isLoading ? <LoadingSpinnerInline inverted /> :t('Create pad') }</button>
    </Form>);
}
