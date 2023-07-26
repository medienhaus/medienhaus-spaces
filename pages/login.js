import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import styled from 'styled-components';

import { useAuth } from '../lib/Auth';

const LoginSection = styled.div`
  & > * + *,
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
    const [isTryingToSignIn, setIsTryingToSignIn] = useState(false);

    const [homeserver, setHomeserver] = useState(getConfig().publicRuntimeConfig.authProviders.matrix?.baseUrl ?? 'https://matrix.org');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const [errorMessage, setErrorMessage] = useState(null);

    const auth = useAuth();
    const { t } = useTranslation('login');

    const onSubmitLoginForm = async () => {
        setIsTryingToSignIn(true);
        setErrorMessage(null);
        await auth.signin(name, password, homeserver).catch(/** @param {MatrixError} error */(error) => {
            if (error.errcode === 'M_LIMIT_EXCEEDED') setErrorMessage(t('{{error}}, please wait {{time}} seconds.', { error: error.data.error, time: Math.round(error.data.retry_after_ms / 1000) }));
            else setErrorMessage(error.data?.error);
        });
        setIsTryingToSignIn(false);
    };

    const changeHomeserver = () => {
        setHomeserver(prompt(`${t('Set another homeserver')}:`, homeserver) ?? homeserver);
    };

    const onLogout = () => {
        auth.signout();
    };

    const logAuthenticationStatus = () => {
        console.log('matrix authentication provider status:');
        console.log(auth.getAuthenticationProvider('matrix'));
        console.log('matrixContentStorage authentication provider status:');
        console.log(auth.getAuthenticationProvider('matrixContentStorage'));
        console.log('peerTube authentication provider status:');
        console.log(auth.getAuthenticationProvider('peerTube'));
    };

    return (
        <>
            <h2>/login</h2>
            <LoginSection>
                { auth.user ? (
                    <>
                        <button type="button" onClick={onLogout}>{ t('Logout') }</button>
                        { /*
                        <a href="#" onClick={logAuthenticationStatus}>{ t('Log Authentication Provider Statuses') }</a>
                        */ }
                        <button type="button" onClick={logAuthenticationStatus}>{ t('Log Authentication Provider Status') }</button>
                        <pre>
                            <small>{ JSON.stringify(auth.user, null, 2) }</small>
                        </pre>
                    </>
                ) : (
                    <>
                        <form onSubmit={(e) => { e.preventDefault(); onSubmitLoginForm(); }}>
                            <UsernameHomeserverContainer>
                                <input type="text" placeholder={t('username')} value={name} onChange={(e) => setName(e.target.value)} />
                                { (!getConfig().publicRuntimeConfig.authProviders?.matrix?.baseUrl || getConfig().publicRuntimeConfig.authProviders?.matrix?.allowCustomHomeserver) && (
                                    <Homeserver onClick={changeHomeserver}>:{ homeserver.replace('http://', '').replace('https://', '') }</Homeserver>
                                ) }
                            </UsernameHomeserverContainer>
                            <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
                            <button type="submit" disabled={isTryingToSignIn}>{ t('Login') }</button>
                            { errorMessage && (<p>❗️ { errorMessage }</p>) }
                        </form>
                    </>
                ) }
            </LoginSection>
        </>
    );
}

