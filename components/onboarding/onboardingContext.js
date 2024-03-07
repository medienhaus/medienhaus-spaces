import { useCallback, useEffect, useRef, useState, useContext, createContext } from 'react';
import { useRouter } from 'next/router';
import { driver } from 'driver.js'; // import driver.js
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/UI/shadcn/Sheet';
import 'driver.js/dist/driver.css'; //import css
import { Button } from '@/components/UI/shadcn/Button';

import onboadingScript from './onboardingScript.json';

const OnboardingContext = createContext(undefined);

function useOnboardingProvider() {
    const router = useRouter();
    const [active, setActive] = useState(false);

    const [currentRoute, setCurrentRoute] = useState('');

    const [CurrentSteps, setCurrentSteps] = useState([]);

    const [opened, setOpened] = useState(true);
    const [size, setSize] = useState('bottomRight');

    const [currentStep, setCurrentStep] = useState(0);
    const [hasPrev, setHasPrev] = useState(false);
    const [HasNext, setHasNext] = useState(true);
    const [currentStepDescription, setCurrentStepDescription] = useState('');
    const [currentStepTitle, setCurrentStepTitle] = useState('');

    useEffect(() => {
        console.log('active', active);
        setCurrentRoute();
    }, [active]);

    useEffect(() => {
        if (currentRoute) {
            router.push(currentRoute);
        }
    }, [currentRoute, router]);

    const [driverJsConfig, setDriverJsConfig] = useState({
        allowClose: false,
        showProgress: false,
        overlayColor: 'black',
        overlayOpacity: 0.0,
        animate: false,
        popoverClass: 'driverJsPopOver',
        disableButtons: ['next', 'previous', 'close'],
        showButtons: [],
        steps: CurrentSteps,
    });

    const [tourInstance, setTourInstance] = useState(driver(driverJsConfig));

    const processStep = (offset) => {
        if (!tourInstance.isActive()) {
            tourInstance.drive();
            setCurrentStepDescription(tourInstance.getActiveStep().popover.description);
            setCurrentStepTitle(tourInstance.getActiveStep().popover.title);

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
        setCurrentStepTitle(tourInstance.getActiveStep().popover.title);

        tourInstance.refresh();
        setHasPrev(!tourInstance.isFirstStep());
        setHasNext(!tourInstance.isLastStep());
    };

    return {
        active,
        setActive,
        currentRoute,
        CurrentSteps,
        opened,
        setOpened,
        size,
        currentStep,
        hasPrev,
        HasNext,
        currentStepDescription,
        currentStepTitle,
        tourInstance,
        setSize,
    };
}

function useOnboarding() {
    return useContext(OnboardingContext);
}

export { OnboardingContext, useOnboardingProvider, useOnboarding };
