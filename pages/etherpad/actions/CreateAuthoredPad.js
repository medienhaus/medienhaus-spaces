import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';

export default function CreateAuthoredPad({ createPadAndOpen }) {
    const { t } = useTranslation('etherpad');
    const [padName, setPadName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const createAuthoredPad = async () => {
        setIsLoading(true);
        const createPad = await createPadAndOpen(padName, 'public');
        setIsLoading(false);
        if (!createPad) return;
        setPadName('');
    };

    return (
        <Form onSubmit={(e) => { e.preventDefault(); createAuthoredPad(); }}>
            <input type="text" placeholder={t('Name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
            <button type="submit" disabled={!padName}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Create pad') }</button>
        </Form>
    );
}
