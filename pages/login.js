import Link from 'next/link';
import { useState } from 'react';

import { useAuth } from '../lib/Auth';

export default function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const auth = useAuth();

    const onSubmit = () => {
        auth.signin(name, password);
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
        console.log(await auth.getAuthenticationProvider('matrix').getMatrixClient().getProfileInfo(auth.getAuthenticationProvider('matrix').getMatrixClient().getUserId()));
    };

    return (
        <>
            <h1>Login</h1>
            <Link href="/">Home</Link>
            <input type="text" placeholder="Username" value={name} onChange={(e) => setName(e.currentTarget.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
            <button type="button" onClick={onSubmit}>Login</button>
            <br />
            <a href="#" onClick={logAuthenticationStatus}>Log Authentication Provider Statuses</a>
            <br />
            <a href="#" onClick={logGetProfileCall}>Log GetProfile Call</a>
        </>
    );
}
