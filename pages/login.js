import { useState } from 'react';

import { useAuth } from '../lib/Auth';

export default function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const auth = useAuth();

    const onSubmitLoginForm = () => {
        auth.signin(name, password);
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
                        <input type="text" placeholder="Username" value={name} onChange={(e) => setName(e.currentTarget.value)} />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
                        <button type="submit">Login</button>
                    </form>
                </>
            ) }
        </>
    );
}

