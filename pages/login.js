import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../lib/Auth';

export default function Login() {
    const [isTryingToSignIn, setIsTryingToSignIn] = useState(false);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);

    const auth = useAuth();
    const { t } = useTranslation('login');

    const onSubmitLoginForm = async () => {
        setIsTryingToSignIn(true);
        setErrorMessage(null);
        await auth.signin(name, password).catch(/** @param {MatrixError} error */(error) => {
            setErrorMessage(error.message);
        });
        setIsTryingToSignIn(false);
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

    const logGetProfileCall = async () => {
        console.log(
            await auth.getAuthenticationProvider('matrix').getMatrixClient().getProfileInfo(auth.getAuthenticationProvider('matrix').getMatrixClient().getUserId()),
        );
    };

    return (
        <>
            <h1>/login</h1>
            { auth.user ? (
                <>
                    <button type="button" onClick={onLogout}>Logout</button>
                    <br />
                    <a href="#" onClick={logAuthenticationStatus}>Log Authentication Provider Statuses</a>
                    <br />
                    <a href="#" onClick={logGetProfileCall}>Log GetProfile Call</a>
                    <p>{ JSON.stringify(auth.user) }</p>
                    <br />
                </>
            ) : (
                <>
                    <form onSubmit={(e) => { e.preventDefault(); onSubmitLoginForm(); }}>
                        <input type="text" placeholder={t('username')} value={name} onChange={(e) => setName(e.target.value)} />
                        <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="submit" disabled={isTryingToSignIn}>{ t('Login') }</button>
                        { errorMessage && (<p>❗️ { errorMessage }</p>) }
                    </form>
                </>
            ) }
        </>
    );
}

