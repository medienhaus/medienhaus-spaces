import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import Form from './Form';
import ErrorMessage from './ErrorMessage';
import PasswordInputButton from './PasswordInputButton';
import { useAuth } from '@/lib/Auth';

const LoginPrompt = ({ service }) => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [password, setPassword] = useState('');
    const auth = useAuth();
    const { t } = useTranslation();

    const loginAgain = async (e) => {
        setIsSigningIn(true);
        e.preventDefault();
        await auth.validateAuthProvidersAccessTokens(
            auth.getAuthenticationProvider('matrix').getMatrixClient().getUserIdLocalpart(),
            password,
        );
        setIsSigningIn(false);
    };

    return (
        <>
            <h2>{service}</h2>
            <ErrorMessage>{t('The session for {{service}} has expired.', { service })}</ErrorMessage>
            <br />
            <p>{t('Please enter your account password to continue using {{service}}:', { service })}</p>
            <br />
            <Form onSubmit={loginAgain}>
                <PasswordInputButton
                    value={password}
                    placeholder={t('Password')}
                    onChange={(e) => {
                        setPassword(e.target.value);
                    }}
                    disabled={!password || isSigningIn}
                />
            </Form>
        </>
    );
};

export default LoginPrompt;
