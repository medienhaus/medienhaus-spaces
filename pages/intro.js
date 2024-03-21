import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import DefaultLayout from '@/components/layouts/default';
import { useAuth } from '@/lib/Auth';
import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from '@/components/onboarding/onboardingContext';

export default function Intro() {
    const { t } = useTranslation('intro');

    const onboarding = useOnboarding();
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [termsAccepted, setTermsAccepted] = useState(false);

    return (
        <>
            <DefaultLayout.LameColumn className="[&>*+*]:mt-4 [&>div>*+*]:mt-4">
                <div>
                    <h2>/intro</h2>
                    <p>
                        {t('Hello')} <strong>{auth?.user?.displayname}</strong>.
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

                <div>
                    <h3>{t('Features')}</h3>
                    <ul>
                        <li>{t('Real-time messaging')}</li>
                        <li>{t('Video conferencing')}</li>
                        <li>{t('File sharing')}</li>
                        <li>{t('Screen sharing')}</li>
                        <li>{t('Group chats')}</li>
                        <li>{t('Emojis and reactions')}</li>
                    </ul>
                </div>

                <hr />

                <div>
                    <h3>{t('Terms & Conditions / Community Guidlines')}</h3>
                    <p>
                        <Trans
                            t={t}
                            i18nKey="intro"
                            defaults='By using this app, you agree to the <a href="/terms">Terms & Conditions</a> and <a href="/guidelines">Community Guidelines</a>.'
                            components={{ a: <a href /> }}
                        />
                    </p>

                    <Button
                        onClick={() => {
                            setTermsAccepted(true);
                        }}
                    >
                        {t('Accept')}
                    </Button>
                </div>

                <hr />

                <div>
                    <h3>{t('How to start')}</h3>
                    <p>
                        <Trans
                            t={t}
                            i18nKey="intro"
                            defaults="To get started, simply click on the <strong>Start Onboarding</strong> button below. You'll be guided through the setup process, and you'll be ready to use the app in no time."
                            components={{ bold: <strong /> }}
                        />
                    </p>
                    <Button
                        className="bg-accent-foreground text-white hover:bg-accent disabled:bg-muted"
                        disabled={!termsAccepted}
                        onClick={() => {
                            onboarding.startTour();
                        }}
                    >
                        {t('Start Onboarding')}
                    </Button>
                </div>

                <hr />

                <div>
                    <h3>{t('Learn')}</h3>
                    <p>
                        <Trans
                            t={t}
                            i18nKey="intro"
                            defaults='To learn more about the app, visit our <a href="/help">Help Center</a>. You will find detailed guides, tutorials, and troubleshooting tips to help you make the most of the app.'
                            components={{ a: <a href /> }}
                        />
                    </p>
                </div>
            </DefaultLayout.LameColumn>
        </>
    );
}
