import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { driver } from 'driver.js'; // import driver.js

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/UI/shadcn/Sheet';
import 'driver.js/dist/driver.css'; //import css
import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from './onboardingContext';
import onboadingScript from './onboardingScript.json';

const OnboardingPilot = () => {
    const router = useRouter();

    const onboarding = useOnboarding();

    const active = onboarding?.active;

    const [onboardingCurrentRoute, setOnboardingCurrentRoute] = useState('');

    const [onboardingCurrentSteps, setOnboardingCurrentSteps] = useState([]);

    const [onboardingOpen, setOnboardingOpen] = useState(true);
    const [onbordingSize, setOnboardingSize] = useState('bottomRight');

    const [onboardingCurrentStep, setOnboardingCurrentStep] = useState(0);
    const [onboadingHasPrev, setOnboadingHasPrev] = useState(false);
    const [onboadingHasNext, setOnboadingHasNext] = useState(true);
    const [onboardingCurrentStepDescription, setOnboardingCurrentStepDescription] = useState('');
    const [onboadingCurretnStepTitle, setOnboadingCurretnStepTitle] = useState('');

    useEffect(() => {
        console.log('active', active);
        setOnboardingCurrentRoute();
    }, [active]);

    useEffect(() => {
        if (onboardingCurrentRoute) {
            router.push(onboardingCurrentRoute);
        }
    }, [onboardingCurrentRoute, router]);

    const [driverJsConfig, setDriverJsConfig] = useState({
        allowClose: false,
        showProgress: false,
        overlayColor: 'black',
        overlayOpacity: 0.0,
        animate: false,
        popoverClass: 'driverJsPopOver',
        disableButtons: ['next', 'previous', 'close'],
        showButtons: [],
        steps: onboardingCurrentSteps,
    });

    console.log(onboadingScript);

    const tourInstance = driver(driverJsConfig);

    const onbaordingProcessStep = (offset) => {
        if (!tourInstance.isActive()) {
            tourInstance.drive();
            setOnboardingCurrentStepDescription(tourInstance.getActiveStep().popover.description);
            setOnboadingCurretnStepTitle(tourInstance.getActiveStep().popover.title);

            return;
        }

        if (offset > 0 && !tourInstance.isLastStep()) {
            tourInstance.moveNext();
            setOnboardingCurrentStep(tourInstance.getActiveIndex() - 1);
        } else if (offset < 0 && !tourInstance.isFirstStep()) {
            tourInstance.movePrevious();
            setOnboardingCurrentStep(tourInstance.getActiveIndex() + 1);
        }

        setOnboardingCurrentStepDescription(tourInstance.getActiveStep().popover.description);
        setOnboadingCurretnStepTitle(tourInstance.getActiveStep().popover.title);

        tourInstance.refresh();
        setOnboadingHasPrev(!tourInstance.isFirstStep());
        setOnboadingHasNext(!tourInstance.isLastStep());
    };

    return (
        <>
            {active && (
                <Sheet open={onboardingOpen} onOpenChange={setOnboardingOpen} modal={false}>
                    <SheetContent side={onbordingSize}>
                        <SheetHeader>
                            <Button
                                onClick={() => {
                                    setOnboardingSize(onbordingSize === 'bottomRight' ? 'minimized' : 'bottomRight');
                                }}
                            >
                                __
                            </Button>
                            <SheetTitle>{onboadingCurretnStepTitle}</SheetTitle>
                            <SheetDescription>
                                <Button
                                    disabled={!onboadingHasPrev}
                                    onClick={() => {
                                        onbaordingProcessStep(-1);
                                    }}
                                >
                                    prev
                                </Button>
                                <Button
                                    disabled={!onboadingHasNext}
                                    onClick={() => {
                                        onbaordingProcessStep(1);
                                    }}
                                >
                                    next
                                </Button>

                                <hr />
                                {onboardingCurrentStepDescription}
                            </SheetDescription>
                        </SheetHeader>
                        some test
                        {active && onboadingHasNext && <Button>continue with </Button>}
                    </SheetContent>
                </Sheet>
            )}
        </>
    );
};

export default OnboardingPilot;
