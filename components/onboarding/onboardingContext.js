import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { driver } from 'driver.js'; // import driver.js

import 'driver.js/dist/driver.css'; //import css
import onboardingScriptGeneric from './onboardingScriptGeneric.json';
import onboardingScriptCustom from './onboardingScriptCustom.json';

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

    const onboardingScript = onboardingScriptCustom?.length > 0 ? onboardingScriptCustom : onboardingScriptGeneric;

    const isScriptCustom = onboardingScriptCustom?.length > 0;

    const startTour = (position = 0) => {
        if (position > onboardingScript.length - 1) {
            position = 0;
        }

        // start the tour with the first route and its steps. reset everything to the initial state
        setCurrentRoute(onboardingScript[position].route);
        setCurrentSteps(onboardingScript[position].steps);
        setCurrentRouteIndex(position);
        setCurrentStep(0);
        setActive(true);

        if (position > 0) {
            setPrevRouteName(onboardingScript[position - 1].route);
        }

        if (onboardingScript[position].route) router.push(onboardingScript[position].route);
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
            setCurrentStepDescription(tourInstance.getActiveStep()?.popover?.description);
            setCurrentStepTitle(tourInstance.getActiveStep()?.popover?.title);
            tourInstance.refresh();
            setHasPrev(!tourInstance.isFirstStep());
            setHasNext(!tourInstance.isLastStep());
        }
    }, [tourInstance]);

    useEffect(() => {
        // set the next route name if there are more routes in the onboarding script. the nextRoutName is used in the onboarding Pilot component to display the next route name if the last step of the current route is reached
        if (!hasNext && currentRouteIndex + 1 < onboardingScript.length) {
            setNextRouteName(onboardingScript[currentRouteIndex + 1].route);
        } else {
            setNextRouteName('');
        }
    }, [currentRouteIndex, hasNext, onboardingScript]);

    const nextRoute = () => {
        // if there are more routes in the onboarding script, move to the next route
        if (currentRouteIndex + 1 < onboardingScript.length) {
            setPrevRouteName(currentRoute);
            const newIndex = currentRouteIndex + 1;
            setCurrentRouteIndex(newIndex);
            setCurrentRoute(onboardingScript[newIndex].route);
            setCurrentSteps(onboardingScript[newIndex].steps);
            if (onboardingScript[newIndex].route) router.push(onboardingScript[newIndex].route);
        }
    };

    const prevRoute = () => {
        if (currentRouteIndex - 1 >= 0) {
            const newIndex = currentRouteIndex - 1;
            setCurrentRouteIndex(newIndex);
            setCurrentRoute(onboardingScript[newIndex].route);
            setCurrentSteps(onboardingScript[newIndex].steps);
            if (onboardingScript[newIndex].route) router.push(onboardingScript[newIndex].route);

            if (newIndex > 0) {
                setPrevRouteName(onboardingScript[newIndex - 1].route);
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
        tourInstance?.destroy();
        setCurrentRouteIndex(0);
        setCurrentSteps([]);
    };

    const writeOnboardStateToAccountData = async (matrixClient, overwrittenData) => {
        const data = {
            active: active,
            currentRouteIndex: currentRouteIndex,
            completed: false,
        };

        Object.keys(overwrittenData).forEach((key) => {
            data[key] = overwrittenData[key];
        });

        await matrixClient.setAccountData('dev.medienhaus.spaces.onboarding', data);
    };

    return {
        active,
        setActive,
        setCurrentRoute,
        currentRoute,
        currentSteps,
        currentRouteIndex,
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
        writeOnboardStateToAccountData,
    };
}

function useOnboarding() {
    return useContext(OnboardingContext);
}

export { OnboardingContext, useOnboardingProvider, useOnboarding };
