import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { styled } from 'styled-components';
import { useRouter } from 'next/router';

import DefaultLayout from '@/components/layouts/default';
import PasswordInputButton from '@/components/UI/PasswordInputButton';
import { useAuth } from '@/lib/Auth';
import { Input } from '@/components/UI/shadcn/Input';

const LoginSection = styled.div`
    & > form > * + * {
        margin-top: var(--margin);
    }

    & > pre {
        overflow-x: scroll;
    }
`;

/* TODO: refine this for shadcn/ui + tailwind */
const UsernameHomeserverContainer = styled.div`
    position: relative;
`;

/* TODO: refine this for shadcn/ui + tailwind */
const Homeserver = styled.span`
    position: absolute;
    top: -4px;
    right: var(--margin);
    max-width: 40%;
    overflow: hidden;
    line-height: calc(var(--margin) * 3);
    color: hsl(var(--muted-foreground));
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
    if (auth.user) router.push('/dashboard');

    const onSubmitLoginForm = async () => {
        setIsTryingToSignIn(true);
        setErrorMessage(null);
        await auth.signin(name, password, homeserver).catch(
            /** @param {MatrixError} error */ (error) => {
                if (error.errcode === 'M_LIMIT_EXCEEDED')
                    setErrorMessage(
                        t('{{error}}, please wait {{time}} seconds.', {
                            error: error.data.error,
                            time: Math.round(error.data.retry_after_ms / 1000),
                        }),
                    );
                else setErrorMessage(error.data?.error);
            },
        );

        setIsTryingToSignIn(false);
    };

    const changeHomeserver = () => {
        setHomeserver(prompt(`${t('Set another homeserver')}:`, homeserver) ?? homeserver);
    };

    // Automatically focus the username input on page load
    useEffect(() => {
        usernameInput.current.focus();
    }, []);

    return (
        <DefaultLayout.LameColumn>
            <h2>/login</h2>
            <LoginSection>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmitLoginForm();
                    }}
                >
                    <UsernameHomeserverContainer>
                        <Input
                            type="text"
                            placeholder={t('Username')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            ref={usernameInput}
                        />
                        {(!getConfig().publicRuntimeConfig.authProviders?.matrix?.baseUrl ||
                            getConfig().publicRuntimeConfig.authProviders?.matrix?.allowCustomHomeserver) && (
                            <Homeserver onClick={changeHomeserver}>:{homeserver.replace('http://', '').replace('https://', '')}</Homeserver>
                        )}
                    </UsernameHomeserverContainer>
                    <PasswordInputButton
                        placeholder={t('Password')}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                        disabled={isTryingToSignIn}
                    />
                    {errorMessage && <p>❗️ {errorMessage}</p>}
                </form>
            </LoginSection>
        </DefaultLayout.LameColumn>
    );
}
