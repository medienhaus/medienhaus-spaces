import { useCallback, useEffect, useRef, useState, useContext, createContext, use } from 'react';
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
    const [nextRouteName, setNextRouteName] = useState('');

    const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

    const [currentSteps, setCurrentSteps] = useState([]);

    const [opened, setOpened] = useState(true);
    const [size, setSize] = useState('bottomRight');

    const [currentStep, setCurrentStep] = useState(0);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(true);
    const [currentStepDescription, setCurrentStepDescription] = useState('');
    const [currentStepTitle, setCurrentStepTitle] = useState('');

    const [driverJsConfig, setDriverJsConfig] = useState({
        allowClose: false,
        showProgress: false,
        overlayColor: 'black',
        overlayOpacity: 0.0,
        animate: false,
        popoverClass: 'driverJsPopOver',
        disableButtons: ['next', 'previous', 'close'],
        showButtons: [],
        steps: [],
    });

    const [tourInstance, setTourInstance] = useState(null);

    const startTour = () => {
        setCurrentRoute(onboadingScript[0].route);
        setCurrentSteps(onboadingScript[0].steps);
        setCurrentStep(0);
        setActive(true);
    };

    useEffect(() => {
        setDriverJsConfig({
            allowClose: false,
            showProgress: false,
            overlayColor: 'black',
            overlayOpacity: 0.0,
            animate: false,
            popoverClass: 'driverJsPopOver',
            disableButtons: ['next', 'previous', 'close'],
            showButtons: [],
            steps: currentSteps,
        });

        console.log('currentSteps', currentSteps);
    }, [currentSteps]);

    useEffect(() => {
        console.log('driverJsConfig', driverJsConfig);

        if (currentSteps.length > 0) {
            setTourInstance(driver(driverJsConfig));
        }
    }, [driverJsConfig, currentSteps]);

    useEffect(() => {
        if (tourInstance) {
            tourInstance.drive();
            setCurrentStepDescription(tourInstance.getActiveStep().popover.description);
            setCurrentStepTitle(tourInstance.getActiveStep().popover.title);
            tourInstance.refresh();
            setHasPrev(!tourInstance.isFirstStep());
            setHasNext(!tourInstance.isLastStep());
        }
    }, [tourInstance]);

    useEffect(() => {
        console.log('active', active);
    }, [active]);

    useEffect(() => {
        if (currentRoute) {
            console.log('currentRoute', currentRoute);
            router.push(currentRoute);
        }
    }, [currentRoute]);

    useEffect(() => {
        if (!hasNext && currentRouteIndex + 1 < onboadingScript.length) {
            setNextRouteName(onboadingScript[currentRouteIndex + 1].route);
        }
    }, [currentRouteIndex, hasNext]);

    const nextRoute = () => {
        if (currentRouteIndex + 1 < onboadingScript.length) {
            const newIndex = currentRouteIndex + 1;
            setCurrentRouteIndex(newIndex);
            setCurrentRoute(onboadingScript[newIndex].route);
            setCurrentSteps(onboadingScript[newIndex].steps);
        }
    };

    const processStep = (offset) => {
        console.log('processStep', offset);

        if (!tourInstance.isActive()) {
            tourInstance.drive();
            setCurrentStepDescription(tourInstance.getActiveStep().popover.description);
            setCurrentStepTitle(tourInstance.getActiveStep().popover.title);

            return;
        }

        if (offset > 0 && !tourInstance.isLastStep()) {
            tourInstance.moveNext();
            setCurrentStep(tourInstance.getActiveIndex() + 1);
        } else if (offset < 0 && !tourInstance.isFirstStep()) {
            tourInstance.movePrevious();
            setCurrentStep(tourInstance.getActiveIndex() - 1);
        }

        setCurrentStepDescription(tourInstance.getActiveStep().popover.description);
        setCurrentStepTitle(tourInstance.getActiveStep().popover.title);

        tourInstance.refresh();
        setHasPrev(!tourInstance.isFirstStep());
        setHasNext(!tourInstance.isLastStep());
        console.log(tourInstance.isLastStep());
    };

    return {
        active,
        setActive,
        currentRoute,
        currentSteps,
        opened,
        setOpened,
        size,
        currentStep,
        hasPrev,
        hasNext,
        currentStepDescription,
        currentStepTitle,
        tourInstance,
        setSize,
        startTour,
        processStep,
        nextRoute,
        nextRouteName,
    };
}

function useOnboarding() {
    return useContext(OnboardingContext);
}

export { OnboardingContext, useOnboardingProvider, useOnboarding };
