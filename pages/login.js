import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import styled from 'styled-components';

import { useAuth } from '../lib/Auth';

const UsernameHomeserverContainer = styled.div`
  position: relative;
  
  @media (min-width: 29em) {
    display: flex;
    align-items: baseline;
  }
`;

const Homeserver = styled.span`
  color: var(--color-me);
  cursor: pointer;
  position: absolute;
  line-height: calc(var(--margin) * 3);
  right: var(--margin);
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
            setErrorMessage(error.message);
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
            <h1>/login</h1>
            { auth.user ? (
                <>
                    <button type="button" onClick={onLogout}>Logout</button>
                    <br />
                    <a href="#" onClick={logAuthenticationStatus}>Log Authentication Provider Statuses</a>
                    <p>{ JSON.stringify(auth.user) }</p>
                    <br />
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
        </>
    );
}

