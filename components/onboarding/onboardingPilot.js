import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { driver } from 'driver.js'; // import driver.js

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/UI/shadcn/Sheet';
import 'driver.js/dist/driver.css'; //import css
import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from './onboardingContext';

const OnboardingPilot = () => {
    const onboarding = useOnboarding();

    const active = onboarding?.active;

    const currentRoute = onboarding?.currentRoute;
    const currentSteps = onboarding?.currentSteps;
    const opened = onboarding?.open;
    const size = onboarding?.size;
    const currentStepDescription = onboarding?.currentStepDescription;
    const currentStepTitle = onboarding?.currentStepTitle;

    const tourInstance = onboarding?.tourInstance;

    return (
        <>
            {active && (
                <Sheet open={onboarding?.opened} onOpenChange={onboarding?.setOpened} modal={false}>
                    <SheetContent side={size}>
                        <SheetHeader>
                            <Button
                                onClick={() => {
                                    onboarding?.setSize(size === 'bottomRight' ? 'minimized' : 'bottomRight');
                                }}
                            >
                                __
                            </Button>
                            <SheetTitle>{onboarding?.currentStepTitle}</SheetTitle>
                            <SheetDescription>
                                <Button
                                    disabled={!onboarding?.hasPrev}
                                    onClick={() => {
                                        onboarding.processStep(-1);
                                    }}
                                >
                                    prev
                                </Button>
                                <Button
                                    disabled={!onboarding?.hasNext}
                                    onClick={() => {
                                        onboarding.processStep(1);
                                    }}
                                >
                                    next
                                </Button>

                                <hr />
                                {onboarding?.currentStepDescription}
                            </SheetDescription>
                        </SheetHeader>
                        some test
                        {active && !onboarding?.hasNext && (
                            <Button
                                onClick={() => {
                                    onboarding?.nextRoute();
                                }}
                            >
                                continue with {onboarding?.nextRouteName}
                            </Button>
                        )}
                    </SheetContent>
                </Sheet>
            )}
        </>
    );
};

export default OnboardingPilot;
