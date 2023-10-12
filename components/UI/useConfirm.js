import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import DefaultModal from './Modal';
import ConfirmCancelButtons from './ConfirmCancelButtons';
import Form from './Form';

const useLoginPrompt = () => {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [resolver, setResolver] = useState({ resolver: null });
    const [label, setLabel] = useState();
    const { t } = useTranslation();

    const createPromise = async () => {
        let resolver;

        return [new Promise((resolve, reject) => {
            resolver = resolve;
        }), resolver];
    };

    const getConfirmation = async (text) => {
        setLabel(text);
        setOpen(true);
        const [promise, resolve] = await createPromise();
        setResolver({ resolve });

        return promise;
    };

    const onClick = async (status) => {
        setOpen(false);
        resolver.resolve(status);
    };

    const Confirmation = () => (
        <DefaultModal isOpen={open}
            contentLabel={label}
            onRequestClose={() => onClick(false)}>
            <Form>
                <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
                <ConfirmCancelButtons disabled={!password} onClick={() => onClick(password)} onCancel={() => onClick(false)} />
            </Form>
        </DefaultModal>
    );

    return [getConfirmation, Confirmation];
};

export default useLoginPrompt;
