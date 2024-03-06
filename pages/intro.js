import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import getConfig from 'next/config';
import { Trans, useTranslation } from 'react-i18next';
import { filter, map, set } from 'lodash';
import { styled } from 'styled-components';
import { driver } from 'driver.js'; // import driver.js

import { useAuth } from '@/lib/Auth';
import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';
import DefaultLayout from '@/components/layouts/default';
import { Input } from '@/components/UI/shadcn/Input';
import { Button } from '@/components/UI/shadcn/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/UI/shadcn/Sheet';
import 'driver.js/dist/driver.css'; //import css

const IntroSection = styled(DefaultLayout.LameColumn)`
    /* TODO: these kind of layout spacings probably need to
   * be refined across all pages once merged into main */

    > * + * {
        margin-top: calc(var(--margin) * var(--line-height) * 2);
    }

    > * > * + * {
        margin-top: calc(var(--margin) * var(--line-height));
    }
`;

export default function Intro() {
    const { t } = useTranslation('intro');

    const [termsAccepted, setTermsAccepted] = useState(false);

    const [onboardingOpen, setOnboardingOpen] = useState(true);
    const [onbordingSize, setOnboardingSize] = useState('bottomRight');

    const [onboardingCurrentStep, setOnboardingCurrentStep] = useState(0);
    const [onboadingHasPrev, setOnboadingHasPrev] = useState(false);
    const [onboadingHasNext, setOnboadingHasNext] = useState(true);
    const [onboardingCurrentStepDescription, setOnboardingCurrentStepDescription] = useState('');
    const [onboadingCurretnStepTitle, setOnboadingCurretnStepTitle] = useState('');

    const config = {
        allowClose: false,
        showProgress: false,
        overlayColor: 'black',
        overlayOpacity: 0.0,
        animate: false,
        popoverClass: 'driverJsPopOver',
        disableButtons: ['next', 'previous', 'close'],
        showButtons: [],
        steps: [
            {
                element: 'p:first-of-type',
                popover: {
                    title: 'Step 1',
                    description: 'This is the first step of the tour.',
                    showButtons: false,
                },
            },
            {
                element: 'h3:first-of-type',
                popover: {
                    title: 'Step 2',
                    description: 'This is the second step of the tour.',
                    showButtons: false,
                },
            },
            {
                element: 'h3:nth-of-type(2)',
                popover: {
                    title: 'Step 3',
                    description: 'This is the third step of the tour.',
                    showButtons: false,
                },
            },
            {
                element: 'h3:last-of-type',
                popover: {
                    title: 'Step 4',
                    description: 'This is the last step of the tour.',
                    showButtons: false,
                },
            },
        ],
    };

    const tourInstance = driver(config);

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
            <Sheet open={onboardingOpen} onOpenChange={setOnboardingOpen} modal={false}>
                <SheetContent forceMount={true} side={onbordingSize}>
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
                </SheetContent>
            </Sheet>

            <IntroSection>
                <div>
                    <h2>/intro</h2>
                    <p> {t('Hello User,')}</p>
                    <p>{t("This is an introduction to the app. <bold>It's a great app!</bold>")}</p>

                    <p>
                        {t(
                            "Welcome to our amazing app! This app is designed to provide you with a seamless and enjoyable experience. With its user-friendly interface and powerful features, you'll be able to accomplish your tasks efficiently and effortlessly. Whether you're a beginner or an expert, this app is perfect for you. Start exploring and discover the endless possibilities it offers. ",
                        )}
                    </p>
                </div>

                <hr />

                <h3> {t('Features')}</h3>
                <div>
                    <ul>
                        <li>{t('Real-time messaging')}</li>
                        <li>{t('Video conferencing')}</li>
                        <li>{t('File sharing')}</li>
                        <li>{t('Screen sharing')}</li>
                        <li>{t('Group chats')}</li>
                        <li>{t('Emojis and reactions')}</li>
                    </ul>
                </div>

                <h3>{t('Terms & Conditions / Community Guidlines')}</h3>
                <div>
                    <p>
                        By using this app, you agree to our <a href="/terms">Terms & Conditions</a> and{' '}
                        <a href="/guidelines">Community Guidelines</a>.
                    </p>

                    <Button
                        onClick={() => {
                            setTermsAccepted(true);
                        }}
                    >
                        Accept
                    </Button>
                </div>

                <h3>{t('How to start')}</h3>
                <div>
                    <p>
                        {t(
                            "To get started, simply click on the <strong>Start Onboarding</strong> button below. You'll be guided through the setup process, and you'll be ready to use the app in no time.",
                        )}
                    </p>
                    <Button disabled={!termsAccepted} variant="onboarding">
                        Start Onboarding
                    </Button>
                </div>

                <h3>{t('Learn')}</h3>
                <p>
                    {t(
                        ' To learn more about the app, visit our <a href="/help">Help Center</a>. You\'ll find detailed guides, tutorials, and troubleshooting tips to help you make the most of the app.',
                    )}
                </p>
            </IntroSection>
        </>
    );
}
