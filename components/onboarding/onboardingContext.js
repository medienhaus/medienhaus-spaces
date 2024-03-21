import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { driver } from 'driver.js'; // import driver.js
import 'driver.js/dist/driver.css'; //import css
import { useImmer } from 'use-immer';
import _ from 'lodash';

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

    const onboardingScript = onboardingScriptCustom?.length > 0 ? onboardingScriptCustom : onboardingScriptGeneric;

    const isScriptCustom = onboardingScriptCustom?.length > 0;

    const startTour = (position = 0) => {
        if (!onboardingScript[position]) return;

        if (position > onboardingScript.length - 1) {
            position = 0;
        }

        // start the tour with the first route and its steps. reset everything to the initial state
        setRoute((draft) => {
            draft.name = onboardingScript[position].route;
            draft.index = position;
            draft.steps = onboardingScript[position].steps;
            draft.prevRoute = position > 0 && onboardingScript[position - 1].route;
            draft.nextRoute = onboardingScript[draft.index + 1]?.route;
            draft.isLastStep = onboardingScript[position].length > 1;
            draft.isFirstStep = true;
        });
        setActive(true);
        if (onboardingScript[position].route) router.push(onboardingScript[position].route);
    };

    useEffect(() => {
        let cancelled = false;
        if (cancelled) return;
        // set the config for driver.js with the current steps of the active route
        if (_.isEmpty(route.steps)) return;

        setDriverJsConfig((draft) => {
            if (draft.steps === route.steps) return;
            draft.steps = route.steps;
        });

        return () => (cancelled = true);
        // we need to disable the eslint exhaustive-deps rule because of useImmer
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [route.steps]);

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

        // start the tour if the instance is created, which is the case after a route change
        if (tourInstance) {
            tourInstance.drive();
            setRoute((draft) => {
                draft.title = tourInstance.getActiveStep().popover.title;
                draft.description = tourInstance.getActiveStep().popover.description;
            });
            tourInstance.refresh();
        }

        return () => (cancelled = true);
        // we need to disable the eslint exhaustive-deps rule because of useImmer
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tourInstance]);

    const changeRoute = (direction) => {
        setRoute((draft) => {
            const newIndex = draft.index + direction;

            if (newIndex >= 0 && newIndex < onboardingScript.length) {
                draft.index = newIndex;
                draft.name = onboardingScript[newIndex].route;
                draft.steps = onboardingScript[newIndex].steps;
                draft.isLastStep = onboardingScript[newIndex].length > 1;
                // when changing routes, we always jump to the first step of that route.
                draft.isFirstStep = true;
                draft.nextRoute = onboardingScript[newIndex + 1]?.route;
                draft.prevRoute = onboardingScript[newIndex - 1]?.route;

                if (onboardingScript[newIndex].route) router.push(onboardingScript[newIndex].route);
            }
        });
    };

    const processStep = (offset) => {
        if (!tourInstance.isActive()) {
            // just to make sure, if the tour instance is not active, start the tour
            tourInstance.drive();
            setRoute((draft) => {
                draft.title = tourInstance.getActiveStep().popover.title;
                draft.description = tourInstance.getActiveStep().popover.description;
            });

            return;
        }

        if (offset > 0 && !tourInstance.isLastStep()) {
            tourInstance.moveNext();
        } else if (offset < 0 && !tourInstance.isFirstStep()) {
            tourInstance.movePrevious();
        }

        if ((offset > 0 && route.isLastStep) || (offset < 0 && route.isFirstStep)) {
            changeRoute(offset);
        } else {
            setRoute((draft) => {
                draft.title = tourInstance.getActiveStep().popover.title;
                draft.description = tourInstance.getActiveStep().popover.description;
                draft.isLastStep = tourInstance.isLastStep();
                draft.isFirstStep = tourInstance.isFirstStep();
            });
            tourInstance.refresh();
        }
    };

    const exit = () => {
        setActive(false);
        tourInstance?.destroy();
    };

    return {
        active,
        setActive,
        tourInstance,
        startTour,
        processStep,
        route,
        exit,
        isScriptCustom,
    };
}

function useOnboarding() {
    return useContext(OnboardingContext);
}

export { OnboardingContext, useOnboardingProvider, useOnboarding };
