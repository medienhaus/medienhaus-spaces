import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DefaultModal from './Modal';
import ConfirmCancelButtons from './ConfirmCancelButtons';
import Form from './Form';

const useLoginPrompt = () => {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [resolver, setResolver] = useState({ resolver: null });
    const [label, setLabel] = useState('');
    const { t } = useTranslation();

    const createPromise = () => {
        let resolved;
        let rejected;

        return [new Promise((resolve, reject) => {
            resolved = resolve;
            rejected = reject;
        }), resolved, rejected];
    };

    const loginPrompt = useCallback(async (text) => {
        setLabel(text);
        setOpen(true);
        const [promise, resolve, reject] = createPromise();
        setResolver({ resolve, reject });

        return promise;
    }, []);

    const handlePasswordInput = useCallback((e) => {
        setPassword(e.target.value);
    }, []);

    const onClick = useCallback(async (status) => {
        setOpen(false);
        if (status) resolver.resolve(status);
    }, [resolver]);

    const onCancel = useCallback(async () => {
        setPassword('');
        setOpen(false);
        if (resolver.reject) {
            resolver.reject('User canceled'); // Reject the promise
        }
    }, [resolver]);

    const Confirmation = useCallback(
        ({ password }) => <DefaultModal
            isOpen={open}
            contentLabel={label}
            onRequestClose={() => onCancel()}>
            <Form>
                <input type="password" placeholder={t('password')} value={password} onChange={handlePasswordInput} />
                <ConfirmCancelButtons disableConfirm={!password}
                    onClick={() => onClick(password)}
                    onCancel={onCancel} />
            </Form>
        </DefaultModal>,
        [handlePasswordInput, label, onCancel, onClick, open, t],
    );

    return { loginPrompt, Confirmation, password };
};

export default useLoginPrompt;
