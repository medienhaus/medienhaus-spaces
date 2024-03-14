import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RiSkipDownLine, RiSkipUpLine } from '@remixicon/react';

import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/UI/shadcn/Sheet';
import 'driver.js/dist/driver.css'; //import css
import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from './onboardingContext';
import { useMatrix } from '@/lib/Matrix';
import { useAuth } from '@/lib/Auth';

const OnboardingPilot = () => {
    const onboarding = useOnboarding();
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix();

    const { t } = useTranslation(onboarding?.isScriptCustom ? 'onboardingCustom' : 'onboarding'); //choose the localisation file based on the condition if a custom one is present
    const [side, setSide] = useState('float');
    const [isOpen, setIsOpen] = useState(true);

    //no clue why it is not possible to use the matrix.onboardingData object directly in the context file. therefore we have to use it here and pass it to the context – schade…
    useEffect(() => {
        if (matrix?.onboardingData?.hasOwnProperty('completed') && matrix.onboardingData.completed && onboarding.active) {
            onboarding.exit();
        } else if (matrix?.onboardingData?.hasOwnProperty('active') && matrix?.onboardingData?.active !== onboarding.active) {
            if (matrix?.onboardingData?.active) {
                if (matrix?.onboardingData?.hasOwnProperty('completed') && matrix.onboardingData.completed === false) {
                    onboarding.startTour(matrix?.onboardingData?.currentRouteIndex);
                }
            } else {
                onboarding.setActive(false);
            }
        }
    }, [matrix.onboardingData, onboarding]);

    if (!auth?.user) return null;

    if (!onboarding) return null;

    return (
        <>
            {onboarding.active && (
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
                                setSide((prevState) =>
                                    prevState === 'float' ? 'minified' : 'float',
                                );
                            }}
                        >
                            {side === 'float' ? (
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
                                {onboarding.currentRoute} — {onboarding.currentStepTitle}
                            </SheetTitle>
                            <SheetDescription>{onboarding.currentStepDescription}</SheetDescription>
                        </SheetHeader>

                        <SheetFooter className="mt-6 grid grid-cols-2 gap-4 [&>button:only-child]:[grid-column:2]">
                            {onboarding.active && onboarding.hasPrev && (
                                <Button
                                    disabled={!onboarding.hasPrev}
                                    onClick={() => {
                                        onboarding.processStep(-1);
                                    }}
                                >
                                    {t('Prev')}
                                </Button>
                            )}

                            {onboarding.active && !onboarding.hasPrev && onboarding.prevRouteName && (
                                <Button
                                    onClick={async () => {
                                        await onboarding.writeOnboardStateToAccountData(matrixClient, {
                                            currentRouteIndex: onboarding.currentRouteIndex - 1,
                                        });
                                        onboarding.prevRoute();
                                    }}
                                >
                                    {'\uE1D3'} {onboarding.prevRouteName}
                                </Button>
                            )}

                            {onboarding.active && onboarding.hasNext && (
                                <Button
                                    disabled={!onboarding.hasNext}
                                    onClick={() => {
                                        onboarding.processStep(1);
                                    }}
                                >
                                    {t('Next')}
                                </Button>
                            )}

                            {onboarding.active && !onboarding.hasNext && onboarding.nextRouteName.length > 0 && (
                                <Button
                                    onClick={async () => {
                                        await onboarding.writeOnboardStateToAccountData(matrixClient, {
                                            currentRouteIndex: onboarding.currentRouteIndex + 1,
                                        });
                                        onboarding.nextRoute();
                                    }}
                                >
                                    {'\uE1D8'} {onboarding.nextRouteName}
                                </Button>
                            )}

                            {onboarding.active && !onboarding.hasNext && !onboarding.nextRouteName.length > 0 && (
                                <Button
                                    onClick={async () => {
                                        onboarding.exit();
                                        await onboarding.writeOnboardStateToAccountData(matrixClient, { completed: true, active: false });
                                    }}
                                >
                                    {t('Close')}
                                </Button>
                            )}
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            )}
        </>
    );
};

export default OnboardingPilot;
