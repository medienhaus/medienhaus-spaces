import styled, { createGlobalStyle } from 'styled-components';
import React from 'react';
import Link from 'next/link';

import { AuthContext, useAuthProvider } from '../lib/Auth';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
`;

const NavContainer = styled.nav`
    float: right;
`;

export default function App({ Component, pageProps }) {
    const auth = useAuthProvider();

    return (
        <>
            <AuthContext.Provider value={auth}>
                <GlobalStyle />
                <Component {...pageProps} />
                <NavContainer>
                    <ul>
                        <li><Link href="/">Home</Link></li>
                        <li><Link href="/login">Login</Link></li>
                    </ul>
                </NavContainer>
            </AuthContext.Provider>
        </>
    );
}
