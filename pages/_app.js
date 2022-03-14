import React from 'react';

import { AuthContext, useAuthProvider } from '../lib/Auth';
import DefaultLayout from '../components/layouts/default';
import '../lib/Internationalization';

import 'normalize.css/normalize.css';
import '/assets/_globalCss.css';

export default function App({ Component, pageProps }) {
    const auth = useAuthProvider();

    return (
        <>
            <AuthContext.Provider value={auth}>
                <DefaultLayout>
                    <Component {...pageProps} />
                </DefaultLayout>
            </AuthContext.Provider>
        </>
    );
}
