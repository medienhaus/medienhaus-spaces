import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiSkipDownLine, RiSkipUpLine } from '@remixicon/react';
import 'driver.js/dist/driver.css'; //import css
import { useRouter } from 'next/router';

import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from './onboardingContext';
import { useMatrix } from '@/lib/Matrix';
import { useAuth } from '@/lib/Auth';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/UI/shadcn/Sheet';

// @TODO write to matrix.onbardingdata on initial start of onboarding and on previous Route.
const OnboardingPilot = () => {
    const onboarding = useOnboarding();
    const auth = useAuth();
    const router = useRouter();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix();

    const { t } = useTranslation(onboarding?.isScriptCustom ? 'onboardingCustom' : 'onboarding'); //choose the localisation file based on the condition if a custom one is present
    const [side, setSide] = useState('floating');
    const [isOpen, setIsOpen] = useState(true);
    const onboardingRoute = onboarding?.route;

    useEffect(() => {
        let cancelled = false;

        if (cancelled) return;

        if (matrix?.onboardingData?.active && onboarding.active === false) {
            onboarding.startTour(matrix?.onboardingData?.currentRouteIndex);
        } else if (matrix?.onboardingData?.active === false) {
            onboarding.setActive(false);
        }

        return () => (cancelled = true);
    }, [matrix.onboardingData, onboarding]);

    useEffect(() => {
        let cancelled = false;

        if (cancelled) return;

        // If the user is logged in and the onboarding is not active, we need to check if this is the first time the user logs in. this is achieved by checking if the onboardingData stored in the matrix accountData object is empty
        // we have to use a Effect to listen to the matrixData object, if the initialSync is done
        if (
            matrix.initialSyncDone &&
            router.route !== '/intro' &&
            auth.user &&
            !onboarding.active &&
            Object.keys(matrix.onboardingData).length === 0
        ) {
            router.push('/intro');
        }

        return () => (cancelled = true);
    }, [matrix, router, auth, onboarding]);

    const writeOnboardStateToAccountData = async (active, index) => {
        const data = {
            active: active,
            currentRouteIndex: index,
        };

        await matrixClient.setAccountData('dev.medienhaus.spaces.onboarding', data);
    };

    const closeOnboarding = async () => {
        onboarding.exit();
        await writeOnboardStateToAccountData(false);
    };

    const nextStep = async () => {
        if (onboardingRoute.isLastStep && onboardingRoute.nextRoute) {
            await writeOnboardStateToAccountData(true, onboardingRoute.index + 1);
        }

        onboarding.processStep(1);
    };

    if (!auth?.user || !onboarding || !onboarding.active) return;

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
                <SheetContent
                    side={side}
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                    }}
                >
                    <Button
                        className="text-white hover:text-accent"
                        variant="ghost"
                        size="icon"
                        onClick={(event) => {
                            event.preventDefault;
                            setSide((prevState) => (prevState === 'floating' ? 'minified' : 'floating'));
                        }}
                    >
                        {side === 'floating' ? (
                            <>
                                <RiSkipDownLine />
                                <span className="sr-only">{t('Minimise')}</span>
                            </>
                        ) : (
                            <>
                                <RiSkipUpLine />
                                <span className="sr-only">{t('Maximise')}</span>
                            </>
                        )}
                    </Button>

                    <SheetHeader>
                        <SheetTitle>
                            {onboardingRoute.name} — {t(onboardingRoute.title)}
                        </SheetTitle>
                        <SheetDescription>{t(onboardingRoute.description)}</SheetDescription>
                    </SheetHeader>

                    <SheetFooter className="mt-6 grid grid-cols-2 gap-4 [&>button:only-child]:[grid-column:2]">
                        <Button
                            disabled={onboardingRoute.isFirstStep && !onboardingRoute.prevRoute}
                            onClick={() => {
                                onboarding.processStep(-1);
                            }}
                        >
                            {onboardingRoute.isFirstStep && onboardingRoute.prevRoute ? `\uE1D3 ${onboardingRoute.prevRoute}` : t('Prev')}
                        </Button>
                        <Button onClick={onboardingRoute.isLastStep && !onboardingRoute.nextRoute ? closeOnboarding : nextStep}>
                            {onboardingRoute.isLastStep && !onboardingRoute.nextRoute
                                ? t('Close')
                                : onboardingRoute.isLastStep
                                  ? `\uE1D8 ${onboardingRoute.nextRoute}`
                                  : t('Next')}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </>
    );
};

export default OnboardingPilot;
