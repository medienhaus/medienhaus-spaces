import { createContext, use, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { driver } from 'driver.js'; // import driver.js

import 'driver.js/dist/driver.css'; //import css
import onboadingScriptGeneric from './onboardingScriptGeneric.json';
import onboadingScriptCustom from './onboardingScriptCustom.json';

const OnboardingContext = createContext(undefined);

function useOnboardingProvider() {
    const router = useRouter();
    const [active, setActive] = useState(false);

    const [currentRoute, setCurrentRoute] = useState('');
    const [nextRouteName, setNextRouteName] = useState('');

    const [prevRouteName, setPrevRouteName] = useState('');

    const [currentRouteIndex, setCurrentRouteIndex] = useState(0);

    const [currentSteps, setCurrentSteps] = useState([]);

    const [currentStep, setCurrentStep] = useState(0);
    const [hasPrev, setHasPrev] = useState(false);
    const [hasNext, setHasNext] = useState(false);
    const [currentStepDescription, setCurrentStepDescription] = useState('');
    const [currentStepTitle, setCurrentStepTitle] = useState('');

    const [driverJsConfig, setDriverJsConfig] = useState(null);

    const [tourInstance, setTourInstance] = useState(null);

    const onboadingScript = onboadingScriptCustom?.length > 0 ? onboadingScriptCustom : onboadingScriptGeneric;

    const isScriptCustom = onboadingScriptCustom?.length > 0;

    const startTour = () => {
        // start the tour with the first route and its steps. reset everything to the initial state
        setCurrentRoute(onboadingScript[0].route);
        setCurrentSteps(onboadingScript[0].steps);
        setCurrentStep(0);
        setActive(true);
        router.push(onboadingScript[0].route);
    };

    useEffect(() => {
        // set the config for driver.js with the current steps of the active route
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
    }, [currentSteps]);

    useEffect(() => {
        // create tour instance with the driver.js config if populated
        if (currentSteps.length > 0) {
            setTourInstance(driver(driverJsConfig));
        }
    }, [driverJsConfig, currentSteps]);

    useEffect(() => {
        // start the tour if the instance is created, which is the case after a route change
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
        // set the next route name if there are more routes in the onboarding script. the nextRoutName is used in the onboarding Pilot component to display the next route name if the last step of the current route is reached
        if (!hasNext && currentRouteIndex + 1 < onboadingScript.length) {
            setNextRouteName(onboadingScript[currentRouteIndex + 1].route);
        } else {
            setNextRouteName('');
        }
    }, [currentRouteIndex, hasNext, onboadingScript]);

    const nextRoute = () => {
        // if there are more routes in the onboarding script, move to the next route
        if (currentRouteIndex + 1 < onboadingScript.length) {
            setPrevRouteName(currentRoute);
            const newIndex = currentRouteIndex + 1;
            setCurrentRouteIndex(newIndex);
            setCurrentRoute(onboadingScript[newIndex].route);
            setCurrentSteps(onboadingScript[newIndex].steps);
            router.push(onboadingScript[newIndex].route);
        }
    };

    const prevRoute = () => {
        if (currentRouteIndex - 1 >= 0) {
            const newIndex = currentRouteIndex - 1;
            setCurrentRouteIndex(newIndex);
            setCurrentRoute(onboadingScript[newIndex].route);
            setCurrentSteps(onboadingScript[newIndex].steps);
            router.push(onboadingScript[newIndex].route);

            if (newIndex > 0) {
                setPrevRouteName(onboadingScript[newIndex - 1].route);
            } else {
                setPrevRouteName('');
            }
        }
    };

    const processStep = (offset) => {
        if (!tourInstance.isActive()) {
            // just to make sure, if the tour instance is not active, start the tour
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
    };

    const exit = () => {
        setActive(false);
        tourInstance.destroy();
        setCurrentRouteIndex(0);
        setCurrentSteps([]);
    };

    return {
        active,
        currentRoute,
        currentSteps,
        currentStep,
        hasPrev,
        hasNext,
        currentStepDescription,
        currentStepTitle,
        tourInstance,
        startTour,
        processStep,
        prevRoute,
        nextRoute,
        prevRouteName,
        nextRouteName,
        exit,
        isScriptCustom,
    };
}

function useOnboarding() {
    return useContext(OnboardingContext);
}

export { OnboardingContext, useOnboardingProvider, useOnboarding };
