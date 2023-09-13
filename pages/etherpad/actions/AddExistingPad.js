import { useState } from 'react';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import Form from '../../../components/UI/Form';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { path as etherpadPath } from '../../../lib/Etherpad';

export default function AddExistingPad({ callbackDone, createWriteRoom }) {
    const router = useRouter();
    const { t } = useTranslation('etherpad');

    const [padName, setPadName] = useState('');
    const [padLink, setPadLink] = useState('');
    const [validLink, setValidLink] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validatePadUrl = (e) => {
        if (e.target.value.includes(getConfig().publicRuntimeConfig.authProviders.etherpad.baseUrl)) setValidLink(true);
        else setValidLink(false);
        setPadLink(e.target.value);
    };

    const handleExistingPadSubmit = async () => {
        setIsLoading(true);
        const roomId = await createWriteRoom(padLink, padName);

        callbackDone && callbackDone();
        setPadLink('');
        setIsLoading(false);

        router.push(`${etherpadPath}/${roomId}`);
    };

    return (
        <Form onSubmit={(e) => { e.preventDefault(); handleExistingPadSubmit(); }}>
            <input type="text" placeholder={t('Pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
            <input type="text" placeholder={t('Link to pad')} value={padLink} onChange={validatePadUrl} />
            { !validLink && padLink && (
                <ErrorMessage>
                    { t('Make sure your link includes "{{url}}"', { url: getConfig().publicRuntimeConfig.authProviders.etherpad.baseUrl }) }
                </ErrorMessage>
            ) }
            <button type="submit" disabled={!padName || !padLink || !validLink}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Add pad') }</button>
        </Form>);
}
