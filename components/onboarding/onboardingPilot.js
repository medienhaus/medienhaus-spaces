import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiSkipDownLine, RiSkipUpLine } from '@remixicon/react';
import 'driver.js/dist/driver.css'; //import css
import _ from 'lodash';
import { toast } from 'sonner';
import { useRouter } from 'next/router';

import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from './onboardingContext';
import { useMatrix } from '@/lib/Matrix';
import { useAuth } from '@/lib/Auth';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/UI/shadcn/Sheet';
import onboardingScriptCustom from './onboardingScriptCustom.json';

const OnboardingPilot = () => {
    const onboarding = useOnboarding();
    const auth = useAuth();
    const matrix = useMatrix();

    const { t } = useTranslation(onboardingScriptCustom.length > 0 ? 'onboardingCustom' : 'onboarding');
    const [side, setSide] = useState('floating');
    const [isOpen, setIsOpen] = useState(true);
    const onboardingRoute = onboarding?.route;
    const prevOnboardingDataRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        let cancelled = false;

        if (cancelled) return;

        // we only want to start the tour if the onboarding data has actually changed
        if (
            matrix?.onboardingData?.active &&
            onboarding.active === false &&
            !_.isEqual(matrix.onboardingData, prevOnboardingDataRef.current)
        ) {
            onboarding.startTour(matrix?.onboardingData?.currentRouteIndex);
        }

        prevOnboardingDataRef.current = matrix.onboardingData;

        return () => (cancelled = true);
    }, [matrix.onboardingData, onboarding, onboarding.active]);

    useEffect(() => {
        let cancelled = false;

        if (cancelled) return;

        // check if the user has navigated away from the onboarding route and if so redirect them back
        if (auth.user && onboarding.active && onboardingRoute?.name && onboardingRoute?.name !== router.route) {
            router.push(onboardingRoute.name);
        }

        return () => (cancelled = true);
        // we want to purposefully ignore router changes, so users can still navigate away from the current onboarding route but are redirected once they engage with the onboarding again.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onboarding.active, onboardingRoute, onboardingRoute?.name]);

    const closeOnboarding = async () => {
        await writeOnboardingStateToAccountData(auth.getAuthenticationProvider('matrix').getMatrixClient(), false).catch(() => {
            toast.error(t('Couldn’t save onboarding progress.'));
        });
        onboarding.exit();
    };

    const handleNavigationClick = async (direction) => {
        if ((onboardingRoute.isLastStep && onboardingRoute.nextRoute) || (onboardingRoute.isFirstStep && onboardingRoute.prevRoute)) {
            await writeOnboardingStateToAccountData(
                auth.getAuthenticationProvider('matrix').getMatrixClient(),
                true,
                onboardingRoute.index + direction,
            ).catch(() => {
                toast.error(t('Couldn’t save onboarding progress.'));
            });
        }

        onboarding.processStep(direction);
    };

    if (!auth?.user || !onboarding || !onboarding.active) return null;

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
                                handleNavigationClick(-1);
                            }}
                        >
                            {onboardingRoute.isFirstStep && onboardingRoute.prevRoute
                                ? `\uE1D3 ${onboardingRoute.prevRoute}`
                                : t('Previous')}
                        </Button>
                        <Button
                            onClick={
                                onboardingRoute.isLastStep && !onboardingRoute.nextRoute ? closeOnboarding : () => handleNavigationClick(1)
                            }
                        >
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

const writeOnboardingStateToAccountData = async (matrixClient, active, index) => {
    const data = {
        active: active,
        currentRouteIndex: index,
    };

    return matrixClient.setAccountData('dev.medienhaus.spaces.onboarding', data);
};
