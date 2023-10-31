import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import { useAuth } from '../../lib/Auth';
import Form from './Form';
import ConfirmCancelButtons from './ConfirmCancelButtons';
import ErrorMessage from './ErrorMessage';

const LoginPrompt = () => {
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [password, setPassword] = useState('');
    const auth = useAuth();
    const { t } = useTranslation();
    const onClick = async (e, password) => {
        setIsSigningIn(true);
        e.preventDefault();
        await auth.validateAuthProvidersAccessTokens(
            auth.getAuthenticationProvider('matrix').getMatrixClient().getUserIdLocalpart(),
            password,
        ); //getConfig().publicRuntimeConfig.authProviders.etherpad.myPads?.api,
        setIsSigningIn(false);
    };

    const onCancel = () => {
        setPassword('');
    };

    return <Form>
        <ErrorMessage>{ t('Something went wrong. Please resubmit your password.') }</ErrorMessage>
        <input type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => {
                setPassword(e.target.value);
            }
            }
        />
        <ConfirmCancelButtons disableConfirm={!password}
            disabled={isSigningIn}
            onClick={(e) => onClick(e, password)}
            onCancel={onCancel} />
    </Form>;
};
export default LoginPrompt;
