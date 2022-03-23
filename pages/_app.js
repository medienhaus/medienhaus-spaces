import React from 'react';

import '../lib/Internationalization';

import { AuthContext, useAuthProvider } from '../lib/Auth';
import { MatrixContext, useMatrixProvider } from '../lib/Matrix';
import DefaultLayout from '../components/layouts/default';

import 'normalize.css/normalize.css';
import '/assets/_globalCss.css';

export default function App({ Component, pageProps }) {
    const authData = useAuthProvider();
    const matrixData = useMatrixProvider(authData.getActiveMatrixAuthentications());

    return (
        <>
            <AuthContext.Provider value={authData}>
                <MatrixContext.Provider value={matrixData}>
                    <DefaultLayout>
                        <Component {...pageProps} />
                    </DefaultLayout>
                </MatrixContext.Provider>
            </AuthContext.Provider>
        </>
    );
}
