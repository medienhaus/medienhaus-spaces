import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import getConfig from 'next/config';

import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { path as etherpadPath } from '../../../lib/Etherpad';
import { Input } from '@/components/UI/shadcn/input';
import { Button } from '@/components/UI/shadcn/button';

export default function CreateAnonymousPad({ callbackDone, createWriteRoom }) {
    const router = useRouter();
    const { t } = useTranslation('etherpad');

    const [padName, setPadName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createAnonymousPad = async () => {
        setIsLoading(true);
        let string = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
        const charactersLength = characters.length;

        for (let i = 0; i < 20; i++) {
            string += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        const link = getConfig().publicRuntimeConfig.authProviders.etherpad.baseUrl + '/' + string;
        const roomId = await createWriteRoom(link, padName);

        callbackDone && callbackDone();
        setIsLoading(false);
        setPadName('');

        // Forward the user and show the newly created pad
        router.push(`${etherpadPath}/${roomId}`);
    };

    return (
        <Form onSubmit={(e) => { e.preventDefault(); createAnonymousPad(padName); }}>
            <Input type="text" placeholder={t('Name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
            <Button type="submit" disabled={!padName}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Create pad') }</Button>
        </Form>
    );
}
