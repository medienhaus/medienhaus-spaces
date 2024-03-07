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
    const currentStep = onboarding?.currentStep;
    const hasPrev = onboarding?.hasPrev;
    const hasNext = onboarding?.hasNext;
    const currentStepDescription = onboarding?.currentStepDescription;
    const currentStepTitle = onboarding?.currentStepTitle;

    const tourInstance = onboarding?.tourInstance;

    const onbaordingProcessStep = (offset) => {
        if (!tourInstance.isActive()) {
            tourInstance.drive();
            setCurrentStepDescription(tourInstance.getActiveStep().popover.description);
            setCurretnStepTitle(tourInstance.getActiveStep().popover.title);

            return;
        }

        if (offset > 0 && !tourInstance.isLastStep()) {
            tourInstance.moveNext();
            setCurrentStep(tourInstance.getActiveIndex() - 1);
        } else if (offset < 0 && !tourInstance.isFirstStep()) {
            tourInstance.movePrevious();
            setCurrentStep(tourInstance.getActiveIndex() + 1);
        }

        setCurrentStepDescription(tourInstance.getActiveStep().popover.description);
        setCurretnStepTitle(tourInstance.getActiveStep().popover.title);

        tourInstance.refresh();
        setHasPrev(!tourInstance.isFirstStep());
        setHasNext(!tourInstance.isLastStep());
    };

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
                            <SheetTitle>{currentStepTitle}</SheetTitle>
                            <SheetDescription>
                                <Button
                                    disabled={!hasPrev}
                                    onClick={() => {
                                        onbaordingProcessStep(-1);
                                    }}
                                >
                                    prev
                                </Button>
                                <Button
                                    disabled={!hasNext}
                                    onClick={() => {
                                        onbaordingProcessStep(1);
                                    }}
                                >
                                    next
                                </Button>

                                <hr />
                                {currentStepDescription}
                            </SheetDescription>
                        </SheetHeader>
                        some test
                        {active && hasNext && <Button>continue with </Button>}
                    </SheetContent>
                </Sheet>
            )}
        </>
    );
};

export default OnboardingPilot;
