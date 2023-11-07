import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import styled from 'styled-components';
import { useRouter } from 'next/router';

import { useAuth } from '../lib/Auth';

const LoginSection = styled.div`
  max-width: 55ch;

  & > form > * + * {
    margin-top: var(--margin);
  }

  & > pre {
    overflow-x: scroll;
  }
`;

const UsernameHomeserverContainer = styled.div`
  position: relative;
`;

const PasswordInputButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-gap: 0 calc(var(--margin) / var(--line-height));
  align-items: start;

  /* it might work, but i really don’t like it */
  & > * {
    margin-top: unset;
  }
`;

const Homeserver = styled.span`
  position: absolute;
  right: var(--margin);
  max-width: 40%;
  overflow: hidden;
  line-height: calc(var(--margin) * 3);
  color: var(--color-me);
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
`;

export default function Login() {
    const auth = useAuth();
    const router = useRouter();
    const { t } = useTranslation('login');

    const [isTryingToSignIn, setIsTryingToSignIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const [homeserver, setHomeserver] = useState(getConfig().publicRuntimeConfig.authProviders?.matrix?.baseUrl ?? 'https://matrix.org');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const usernameInput = useRef();

    // If we are logged in... what do we want here? Let's forward the user to the dashboard!
    if (auth.user) router.push('/');

    const onSubmitLoginForm = async () => {
        setIsTryingToSignIn(true);
        setErrorMessage(null);

        if (auth.user) {
            await auth.validateAuthProvidersAccessTokens(
                auth.getAuthenticationProvider('matrix').getMatrixClient().getUserIdLocalpart(),
                password,
            );
        } else {
            await auth.signin(name, password, homeserver).catch(/** @param {MatrixError} error */(error) => {
                if (error.errcode === 'M_LIMIT_EXCEEDED') {
                    setErrorMessage(t('{{error}}, please wait {{time}} seconds.', {
                        error: error.data.error,
                        time: Math.round(error.data.retry_after_ms / 1000),
                    }));
                } else setErrorMessage(error.data?.error);
            });
        }

        setIsTryingToSignIn(false);
    };

    const changeHomeserver = () => {
        setHomeserver(prompt(`${t('Set another homeserver')}:`, homeserver) ?? homeserver);
    };

    // Automatically focus the username input on page load
    useEffect(() => {
        if (auth.user !== null && !auth.user) usernameInput.current.focus();
        console.log(auth.user);
    }, [auth.user]);

    return (
        <>
            <h2>/login</h2>
            <LoginSection>
                <form onSubmit={(e) => { e.preventDefault(); onSubmitLoginForm(); }}>
                    <UsernameHomeserverContainer>
                        <input type="text"
                            placeholder={t('username')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            ref={usernameInput} />
                        {
                            (!getConfig().publicRuntimeConfig.authProviders?.matrix?.baseUrl || getConfig().publicRuntimeConfig.authProviders?.matrix?.allowCustomHomeserver) && (
                                <Homeserver
                                    onClick={changeHomeserver}>:{ homeserver.replace('http://', '').replace('https://', '') }
                                </Homeserver>
                            )
                        }
                    </UsernameHomeserverContainer>
                    <PasswordInputButtonContainer>
                        <input type="password"
                            placeholder={t('password')}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                            }}
                        />
                        <button type="submit" disabled={isTryingToSignIn}>{ t('Login') }</button>
                    </PasswordInputButtonContainer>
                    { errorMessage && (<p>❗️ { errorMessage }</p>) }
                </form>
            </LoginSection>
        </>
    );
}
