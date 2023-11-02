import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';
import Form from './Form';
import ErrorMessage from './ErrorMessage';

const InputButton = styled(Form)`
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-gap: 0 calc(var(--margin) / 1.4);
  align-items: start;

  /* it might work, but i really don’t like it */
  & > * {
    margin-top: unset;
  }
`;

const Wrapper = styled.aside`
  /* align next element with nav */
  padding-bottom: calc(var(--margin) * 2.4);
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

const LoginPrompt = () => {
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
            <ErrorMessage>
                { t('Token invalid. Please sign in again.') }
            </ErrorMessage>
            <InputButton>
                <input type="password"
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                    }}
                />
                <button
                    disabled={!password || isSigningIn}
                    onClick={(e) => onClick(e, password)}>
                    { t('Login') }
                </button>
            </InputButton>
        </Wrapper>
    );
};

export default LoginPrompt;
