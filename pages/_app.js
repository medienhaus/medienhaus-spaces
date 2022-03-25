import React from 'react';
import { useRouter } from 'next/router';

import '../lib/Internationalization';

import { AuthContext, useAuthProvider } from '../lib/Auth';
import { MatrixContext, useMatrixProvider } from '../lib/Matrix';
import DefaultLayout from '../components/layouts/default';
import '/assets/_globalCss.css';

const guestRoutes = ['/', '/login'];

export default function App({ Component, pageProps }) {
    const router = useRouter();
    const authData = useAuthProvider();
    const matrixData = useMatrixProvider(authData.getActiveMatrixAuthentications());

    // Guests should be forwarded to /login, unless they're accessing one of the public routes
    if (authData.user === false && !guestRoutes.includes(router.route)) {
        router.push('/login');
        return null;
    }

    return (
        <>
            <AuthContext.Provider value={authData}>
                <MatrixContext.Provider value={matrixData}>
                    <DefaultLayout>
                        { (authData.user || guestRoutes.includes(router.route)) && (
                            <Component {...pageProps} />
                        ) }
                    </DefaultLayout>
                </MatrixContext.Provider>
            </AuthContext.Provider>
        </>
    );
}
