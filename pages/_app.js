import React from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
import { useRouter } from 'next/router';

import { DefaultLayout } from '../components/layouts/default';
import { AuthContext, useAuthProvider } from '../lib/Auth';
import { MatrixContext, useMatrixProvider } from '../lib/Matrix';
import '../lib/Internationalization';
import '/assets/_globalCss.css';
import LostConnection from '../components/UI/LostConnection';

const guestRoutes = ['/', '/login'];

export default function App({ Component, pageProps }) {
    const router = useRouter();

    const authData = useAuthProvider();
    const matrixData = useMatrixProvider(authData);

    let Layout = DefaultLayout;
    if (Component.getLayout) { Layout = Component.getLayout(); }

    // Guests should be forwarded to /login, unless they're accessing one of the public routes
    if (authData.user === false && !guestRoutes.includes(router.route)) {
        router.push('/login');

        return null;
    }

    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
                <link rel="manifest" href="./manifest.webmanifest" />
                <link rel="apple-touch-icon" href="./assets/icons/apple-touch-icon.png" />
                <link rel="icon" type="image/x-icon" href="./favicon.ico" sizes="16x16 32x32" />
                <link rel="icon" type="image/svg+xml" href="./favicon.svg" sizes="any" />
                <link rel="mask-icon" type="image/svg+xml" href="./favicon.svg" />
                <title>{ getConfig().publicRuntimeConfig.name ?? 'medienhaus/' }</title>
            </Head>
            <AuthContext.Provider value={authData}>
                <MatrixContext.Provider value={matrixData}>
                    { !matrixData.isConnectedToServer && <LostConnection /> }
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
