import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import '../lib/Internationalization';

import { AuthContext, useAuthProvider } from '../lib/Auth';
import { MatrixContext, useMatrixProvider } from '../lib/Matrix';
import '/assets/_globalCss.css';
import { SingleColumnLayout } from '../components/layouts/singlecolumn';

const guestRoutes = ['/', '/login'];

export default function App({ Component, pageProps }) {
    const router = useRouter();
    const authData = useAuthProvider();
    const matrixData = useMatrixProvider(authData.getActiveMatrixAuthentications());

    let Layout = SingleColumnLayout;
    if (Component.getLayout) { Layout = Component.getLayout(); }

    // Guests should be forwarded to /login, unless they're accessing one of the public routes
    if (authData.user === false && !guestRoutes.includes(router.route)) {
        router.push('/login');
        return null;
    }

    return (
        <>
            <Head>
                <title>medienhaus-frontend</title>
                <link rel="icon" type="image/svg+xml" href="./favicon.svg" sizes="any" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>
            <AuthContext.Provider value={authData}>
                <MatrixContext.Provider value={matrixData}>
                    <Layout>
                        { (authData.user || guestRoutes.includes(router.route)) && (
                            <Component {...pageProps} />
                        ) }
                    </Layout>
                </MatrixContext.Provider>
            </AuthContext.Provider>
        </>
    );
}
