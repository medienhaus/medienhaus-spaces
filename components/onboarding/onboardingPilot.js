import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
    const [side, setSide] = useState('onboardingBottomRight');
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
                    >
                        <SheetHeader>
                            <Button
                                className=" rounded-lg bg-onboarding p-0"
                                onClick={() => {
                                    setSide((prevState) =>
                                        prevState === 'onboardingBottomRight' ? 'onboardingMinimized' : 'onboardingBottomRight',
                                    );
                                }}
                            >
                                {side === 'onboardingBottomRight' ? '⌄' : '⌅'}
                            </Button>
                            <SheetTitle>
                                {onboarding.currentRoute} — {onboarding.currentStepTitle}
                            </SheetTitle>
                            <SheetDescription>{onboarding.currentStepDescription}</SheetDescription>
                        </SheetHeader>

                        <SheetFooter className="mt-8 grid grid-cols-2 gap-4">
                            {onboarding.active && onboarding.hasPrev && (
                                <Button
                                    disabled={!onboarding.hasPrev}
                                    onClick={() => {
                                        onboarding.processStep(-1);
                                    }}
                                >
                                    {t('prev')}
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
                                    {t('next')}
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
                                    {t('close')}
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
