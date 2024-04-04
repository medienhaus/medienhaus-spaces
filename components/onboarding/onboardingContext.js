import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { driver } from 'driver.js'; // import driver.js
import 'driver.js/dist/driver.css'; //import css
import { useImmer } from 'use-immer';

import onboardingScriptGeneric from './onboardingScriptGeneric.json';
import onboardingScriptCustom from './onboardingScriptCustom.json';

const OnboardingContext = createContext(undefined);

function useOnboardingProvider() {
    const router = useRouter();
    const [active, setActive] = useState(false);
    const [route, setRoute] = useImmer({
        name: '',
        index: 0,
        steps: [],
        hasNext: false,
        hasPrev: false,
        description: '',
        title: '',
    });

    const [driverJsConfig, setDriverJsConfig] = useImmer({
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

    const onboardingScript = onboardingScriptCustom.length > 0 ? onboardingScriptCustom : onboardingScriptGeneric;

    const startTour = useCallback(
        (position = 0) => {
            if (!onboardingScript[position]) return;

            if (position > onboardingScript.length - 1) {
                position = 0;
            }

            setRoute((draft) => updateRouteState(draft, onboardingScript, position));
            setActive(true);
            if (onboardingScript[position].route) router.push(onboardingScript[position].route);
        },
        [onboardingScript, router, setRoute],
    );

    useEffect(() => {
        let cancelled = false;
        if (cancelled) return;

        setDriverJsConfig((draft) => {
            if (draft.steps === route.steps) return;
            draft.steps = route.steps;
        });

        return () => (cancelled = true);
    }, [route.steps, setDriverJsConfig]);

    useEffect(() => {
        let cancelled = false;
        if (cancelled) return;
        // create tour instance with the driver.js config if populated
        if (!driverJsConfig.steps.length) return;

        setTourInstance(driver(driverJsConfig));

        return () => (cancelled = true);
    }, [driverJsConfig]);

    useEffect(() => {
        let cancelled = false;
        if (cancelled) return;

        if (tourInstance) {
            tourInstance.drive();
            setRoute((draft) => updateRouteTitle(draft, tourInstance));
            tourInstance.refresh();
        }

        return () => (cancelled = true);
    }, [tourInstance, setRoute]);

    const changeRoute = useCallback(
        (direction) => {
            setRoute((draft) => updateRouteOnChange(draft, onboardingScript, direction, router));
        },
        [onboardingScript, router, setRoute],
    );

    const processStep = useCallback(
        (offset) => {
            if (!tourInstance.isActive()) {
                tourInstance.drive();
                setRoute((draft) => updateRouteTitle(draft, tourInstance));

                return;
            }

            if ((offset > 0 && !tourInstance.isLastStep()) || (offset < 0 && !tourInstance.isFirstStep())) {
                offset > 0 ? tourInstance.moveNext() : tourInstance.movePrevious();
            }

            if (offset > 0 && route.isLastStep && !route.nextRoute) {
                // Handle the very last step of the onboarding script
                setRoute((draft) => updateRouteStepState(draft, tourInstance));
                tourInstance.refresh();

                return;
            }

            if ((offset > 0 && route.isLastStep) || (offset < 0 && route.isFirstStep)) {
                // handle the last step of the route and jump to the next route
                changeRoute(offset);
            } else {
                // otherwise we just advance one step
                setRoute((draft) => updateRouteStepState(draft, tourInstance));
                tourInstance.refresh();
            }
        },
        [changeRoute, route.isFirstStep, route.isLastStep, route.nextRoute, setRoute, tourInstance],
    );

    const exit = useCallback(() => {
        setActive(false);
        tourInstance?.destroy();
    }, [tourInstance]);

    return {
        active,
        tourInstance,
        startTour,
        processStep,
        route,
        exit,
    };
}

function useOnboarding() {
    return useContext(OnboardingContext);
}

export { OnboardingContext, useOnboardingProvider, useOnboarding };

// Helper functions
const updateRouteState = (draft, onboardingScript, position) => {
    draft.index = position;
    draft.name = onboardingScript[position].route;
    draft.steps = onboardingScript[position].steps;
    draft.prevRoute = position > 0 && onboardingScript[position - 1].route;
    draft.nextRoute = onboardingScript[draft.index + 1]?.route;
    draft.isLastStep = onboardingScript[position].length > 1;
    draft.isFirstStep = true;
};

const updateRouteTitle = (draft, tourInstance) => {
    draft.title = tourInstance.getActiveStep().popover.title;
    draft.description = tourInstance.getActiveStep().popover.description;
};

const updateRouteOnChange = (draft, onboardingScript, direction, router) => {
    const newIndex = draft.index + direction;

    if (newIndex >= 0 && newIndex < onboardingScript.length) {
        draft.index = newIndex;
        draft.name = onboardingScript[newIndex].route;
        draft.steps = onboardingScript[newIndex].steps;
        draft.isLastStep = onboardingScript[newIndex].length > 1;
        draft.isFirstStep = true;
        draft.nextRoute = onboardingScript[newIndex + 1]?.route;
        draft.prevRoute = onboardingScript[newIndex - 1]?.route;

        if (onboardingScript[newIndex].route) router.push(onboardingScript[newIndex].route);
    }
};

const updateRouteStepState = (draft, tourInstance) => {
    draft.title = tourInstance.getActiveStep().popover.title;
    draft.description = tourInstance.getActiveStep().popover.description;
    draft.isLastStep = tourInstance.isLastStep();
    draft.isFirstStep = tourInstance.isFirstStep();
};
