import React from 'react';
import { useRouter } from 'next/router';

import '../lib/Internationalization';

import { AuthContext, useAuthProvider } from '../lib/Auth';
import { MatrixContext, useMatrixProvider } from '../lib/Matrix';
import DefaultLayout from '../components/layouts/default';

import 'normalize.css/normalize.css';
import '/assets/_globalCss.css';

const guestRoutes = ['Dashboard', 'Login'];

export default function App({ Component, pageProps }) {
    const router = useRouter();
    const authData = useAuthProvider();
    const matrixData = useMatrixProvider(authData.getActiveMatrixAuthentications());

    // Guests should be forwarded to /login, unless they're accessing one of the public routes
    if (authData.user === false && !guestRoutes.includes(Component.name)) {
        router.push('/login');
        return null;
    }

    return (
        <>
            <AuthContext.Provider value={authData}>
                <MatrixContext.Provider value={matrixData}>
                    <DefaultLayout>
                        { (authData.user || ['Dashboard', 'Login'].includes(Component.name)) && (
                            <Component {...pageProps} />
                        ) }
                    </DefaultLayout>
                </MatrixContext.Provider>
            </AuthContext.Provider>
        </>
    );
}
