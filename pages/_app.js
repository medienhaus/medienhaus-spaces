import React, { Suspense } from 'react';
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
import { OnboardingContext, useOnboardingProvider } from '@/components/onboarding/onboardingContext';
import OnboardingPilot from '@/components/onboarding/onboardingPilot';
import { Toaster } from '@/components/UI/shadcn/Sonner';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

import 'tldraw/tldraw.css';
import '../assets/_tldrawOverrides.css';
import '../assets/_userOverrides.css';

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
    }

    // If the user is logged in but has not started the onboarding process, redirect to /intro
    if (
        matrixData.initialSyncDone &&
        router.route !== '/intro' &&
        authData.user &&
        !onboarding.active &&
        Object.keys(matrixData.onboardingData).length === 0
    ) {
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
                    <OnboardingContext.Provider value={onboarding}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <DefaultLayout.Layout>
                                {((authData.user && matrixData.initialSyncDone) || guestRoutes.includes(router.route)) && (
                                    <>
                                        <OnboardingPilot />
                                        <Component {...pageProps} />
                                    </>
                                )}
                            </DefaultLayout.Layout>
                        </Suspense>
                    </OnboardingContext.Provider>
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
