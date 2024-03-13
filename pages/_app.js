import React from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { enableMapSet } from 'immer';
import { RiCheckboxCircleLine, RiErrorWarningLine } from '@remixicon/react';

import DefaultLayout from '@/components/layouts/default';
import LostConnection from '@/components/UI/LostConnection';
import { AuthContext, useAuthProvider } from '@/lib/Auth';
import { MatrixContext, useMatrixProvider } from '@/lib/Matrix';
import '../lib/Internationalization';
import '../assets/_globalCss.css';
import '../assets/driverJsCustom.css';
import { useOnboardingProvider, OnboardingContext } from '@/components/onboarding/onboardingContext';
import OnboardingPilot from '@/components/onboarding/onboardingPilot';
import { Toaster } from '@/components/UI/shadcn/Sonner';

// Enable immer support for Map() and Set()
enableMapSet();

const guestRoutes = ['/login'];

export default function App({ Component, pageProps }) {
    const router = useRouter();

    const onboarding = useOnboardingProvider();

    const authData = useAuthProvider();
    const matrixData = useMatrixProvider(authData);

    // Guests should be forwarded to /login, unless they're accessing one of the public routes
    if (authData.user === false && !guestRoutes.includes(router.route)) {
        router.push('/login');

        return null;
    } else if (router.route !== '/intro' && authData.user && !onboarding.active && Object.keys(matrixData.onboardingData).length === 0) {
        // If the user is logged in and the onboarding is not active, we need to check if this is the first time the user logs in. this is achieved by checking if the onboardingData stored in the matrix accountData object is empty
        router.push('/intro');
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
                <title>{getConfig().publicRuntimeConfig.name ?? 'medienhaus/'}</title>
            </Head>
            <AuthContext.Provider value={authData}>
                <MatrixContext.Provider value={matrixData}>
                    {!matrixData.isConnectedToServer && <LostConnection />}
                    <DefaultLayout.Layout>
                        {((authData.user && matrixData.initialSyncDone) || guestRoutes.includes(router.route)) && (
                            <OnboardingContext.Provider value={onboarding}>
                                <OnboardingPilot />
                                <Component {...pageProps} />
                            </OnboardingContext.Provider>
                        )}
                    </DefaultLayout.Layout>
                    <Toaster
                        visibleToasts={10}
                        toastOptions={{
                            classNames: {
                                toast: '[&>div>svg]:w-5',
                                error: '!border-destructive !text-destructive-foreground',
                            },
                        }}
                        icons={{ success: <RiCheckboxCircleLine />, error: <RiErrorWarningLine /> }}
                    />
                </MatrixContext.Provider>
            </AuthContext.Provider>
        </>
    );
}
