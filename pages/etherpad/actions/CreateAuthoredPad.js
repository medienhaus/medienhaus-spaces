import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ButtonPrimary from '../../../components/UI/ButtonPrimary';
import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import logger from '../../../lib/Logging';

export default function CreateAuthoredPad({ createPadAndOpen, callbackDone }) {
    const { t } = useTranslation('etherpad');
    const [padName, setPadName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createAuthoredPad = async () => {
        setIsLoading(true);
        const createPad = await createPadAndOpen(padName, 'public')
            .catch(error => logger.debug(error));
        setIsLoading(false);
        if (!createPad) return;
        callbackDone && callbackDone();
        setPadName('');
    };

    return (
        <Form onSubmit={(e) => { e.preventDefault(); createAuthoredPad(); }}>
            <input type="text" placeholder={t('Name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
            <ButtonPrimary type="submit" disabled={!padName}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Create pad') }</ButtonPrimary>
        </Form>
    );
}
