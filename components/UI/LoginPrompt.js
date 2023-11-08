import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';
import Form from './Form';
import ErrorMessage from './ErrorMessage';
import PasswordInputButton from './PasswordInputButton';

const Wrapper = styled.div`
  /* align next element with nav */
  border-top: 1px solid transparent;

  p {
    line-height: calc(var(--margin) * 3);
    border-bottom: 1px solid transparent;
  }

  /* overwrite styled component attribute of Form.js */
  form {
    margin-top: 0 !important;
  }
`;

const ServiceStatus = styled.div`
  margin-bottom: calc(var(--margin) * var(--line-height));

  > * + * {
    margin-top: var(--margin);

    /* margin-top: calc(var(--margin) * var(--line-height)); */
  }
`;

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
        ); //getConfig().publicRuntimeConfig.authProviders.etherpad.myPads?.api,
        setIsSigningIn(false);
    };

    return (
        <Wrapper>
            <h2>{ service }</h2>
            <ServiceStatus>
                <>
                    <ErrorMessage>
                        { t('Your {{service}} session has expired.', { service: service }) }
                    </ErrorMessage>
                    <p>
                        { t('Please sign in again, in order to use {{service}} without any limitations.', { service: service }) }
                    </p>
                </>
            </ServiceStatus>
            <Form onSubmit={loginAgain}>
                <PasswordInputButton
                    value={password}
                    placeholder={t('password')}
                    onChange={(e) => {
                        setPassword(e.target.value);
                    }}
                    disabled={!password || isSigningIn}
                />
            </Form>
        </Wrapper>
    );
};

export default LoginPrompt;
