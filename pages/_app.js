import { createGlobalStyle } from 'styled-components';
import React from 'react';

import { AuthContext, useAuthProvider } from '../lib/Auth';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
`;

export default function App({ Component, pageProps }) {
    const auth = useAuthProvider();

    return (
        <>
            <AuthContext.Provider value={auth}>
                <GlobalStyle />
                <Component {...pageProps} />
            </AuthContext.Provider>
        </>
    );
}
