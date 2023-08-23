import { useState } from 'react';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { useAuth } from '../../../lib/Auth';

export default function CreateAuthoredPad({ callbackDone, createWriteRoom }) {
    const router = useRouter();
    const { t } = useTranslation('etherpad');

    const auth = useAuth();
    const etherpad = auth.getAuthenticationProvider('etherpad');

    const [padName, setPadName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createAuthoredPad = async () => {
        setIsLoading(true);
        const padId = await etherpad.createPad(padName, 'public');
        if (!padId) {
            setIsLoading(false);

            return;
        }
        const link = getConfig().publicRuntimeConfig.authProviders.etherpad.baseUrl + '/' + padId;
        const roomId = await createWriteRoom(link, padName);
        router.push(`/${getConfig().publicRuntimeConfig.authProviders.etherpad.path}/${roomId}`);

        callbackDone && callbackDone();
        setPadName('');
        setIsLoading(false);
    };

    return (
        <Form onSubmit={(e) => { e.preventDefault(); createAuthoredPad(); }}>
            <input type="text" placeholder={t('pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
            <button type="submit" disabled={!padName}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Create pad') }</button>
        </Form>
    );
}
