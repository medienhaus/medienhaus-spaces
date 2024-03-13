import { use, useCallback, useEffect, useRef, useContext, useState } from 'react';
import { useRouter } from 'next/router';
import getConfig from 'next/config';
import { Trans, useTranslation } from 'react-i18next';
import { filter, map, set } from 'lodash';
import { styled } from 'styled-components';

import { useAuth } from '@/lib/Auth';
import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';
import DefaultLayout from '@/components/layouts/default';
import { Input } from '@/components/UI/shadcn/Input';
import { Button } from '@/components/UI/shadcn/Button';
import { OnboardingContext, useOnboarding } from '@/components/onboarding/onboardingContext';
import { useMatrix } from '@/lib/Matrix';

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

    const onboarding = useOnboarding();
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [termsAccepted, setTermsAccepted] = useState(false);

    return (
        <>
            <IntroSection>
                <div>
                    <h2>/intro</h2>
                    <p>
                        {t('Hello')} {auth?.user?.displayname}{' '}
                    </p>
                    <p>
                        <Trans
                            t={t}
                            i18nKey="intro"
                            defaults="This is an introduction to the app. <bold>It's a great app!</bold>"
                            components={{ bold: <strong /> }}
                        />
                    </p>

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
                        <Trans
                            t={t}
                            i18nKey="intro"
                            defaults="To get started, simply click on the <strong>Start Onboarding</strong> button below. You'll be guided through the setup process, and you'll be ready to use the app in no time."
                            components={{ bold: <strong /> }}
                        />
                    </p>
                    <Button
                        disabled={!termsAccepted}
                        variant="onboarding"
                        onClick={() => {
                            onboarding.startTour();
                            onboarding.writeOnboardStateToAccountData(matrixClient, {
                                completed: false,
                                active: true,
                                currentRouteIndex: 0,
                            });
                        }}
                    >
                        Start Onboarding
                    </Button>
                </div>

                <h3>{t('Learn')}</h3>
                <p>
                    <Trans
                        t={t}
                        i18nKey="intro"
                        defaults='To learn more about the app, visit our <a href="/help">Help Center</a>. You will find detailed guides, tutorials, and troubleshooting tips to help you make the most of the app.'
                        components={{ a: <a href /> }}
                    />
                </p>
            </IntroSection>
        </>
    );
}
