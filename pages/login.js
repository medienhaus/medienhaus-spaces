import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';

import { useAuth } from '../lib/Auth';
import ErrorMessage from '../components/UI/ErrorMessage';

const LoginSection = styled.div`
  max-width: 55ch;

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
    const auth = useAuth();
    const router = useRouter();
    const { t } = useTranslation('login');

    const [isTryingToSignIn, setIsTryingToSignIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const [homeserver, setHomeserver] = useState(getConfig().publicRuntimeConfig.authProviders?.matrix?.baseUrl ?? 'https://matrix.org');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const usernameInput = useRef();
    const useSearch = useSearchParams();

    // If we are logged in... what do we want here? Let's forward the user to the dashboard!
    if (auth.user && auth.connectionStatus.etherpad) router.push('/');

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
        if (!auth.user) usernameInput.current.focus();
    }, []);

    const ServiceStatus = () => {
        return Object.keys(auth.connectionStatus).map((service, index) => {
            return (
                <div>
                    {
                        !auth.connectionStatus[service] && <ErrorMessage>{ t('Your {{service}} session has expired. Please sign in again, in order to use {{service}} ', { service: service }) }</ErrorMessage> }
                    <p key={index}>{ auth.connectionStatus[service] ? '🟢' :' 🔴' } { service } </p>
                </div>);
        });
    };

    console.log(useSearch);

    return (
        <>
            <h2>/login</h2>
            <LoginSection>
                { auth.user && <ServiceStatus /> }
                <form onSubmit={(e) => { e.preventDefault(); onSubmitLoginForm(); }}>
                    { !auth.user && <UsernameHomeserverContainer>
                        <input type="text"
                            placeholder={t('username')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            ref={usernameInput} />
                        { (!getConfig().publicRuntimeConfig.authProviders?.matrix?.baseUrl || getConfig().publicRuntimeConfig.authProviders?.matrix?.allowCustomHomeserver) && (
                            <Homeserver
                                onClick={changeHomeserver}>:{ homeserver.replace('http://', '').replace('https://', '') }</Homeserver>
                        ) }
                    </UsernameHomeserverContainer> }
                    <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit" disabled={isTryingToSignIn}>{ t('Login') }</button>
                    { errorMessage && (<p>❗️ { errorMessage }</p>) }
                </form>
            </LoginSection>
        </>
    );
}

