import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';
import Form from './Form';
import ErrorMessage from './ErrorMessage';

const InputButton = styled(Form)`
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-gap: 0 calc(var(--margin) / var(--line-height));
  align-items: start;

  /* it might work, but i really don’t like it */
  & > * {
    margin-top: unset;
  }
`;

const Wrapper = styled.div`
  /* align next element with nav */
  padding: calc(var(--margin));
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
            <InputButton onSubmit={loginAgain}>
                <input type="password"
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                    }}
                />
                <button type="submit" disabled={!password || isSigningIn}>{ t('Login') }</button>
            </InputButton>
        </Wrapper>
    );
};

export default LoginPrompt;
