import { Trans, useTranslation } from 'react-i18next';

import DefaultLayout from '@/components/layouts/default';
import { useAuth } from '@/lib/Auth';
import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from '@/components/onboarding/onboardingContext';

export default function Intro() {
    const { t } = useTranslation('intro');

    const onboarding = useOnboarding();
    const auth = useAuth();

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
                            i18nKey="intro-p-1"
                            defaults="Welcome to the <bold>udk/spaces</bold> beta version. The application shall provide a rather seamless and enjoyable experience around several embedded services/tools (see features below)."
                            components={{ bold: <strong /> }}
                        />
                    </p>
                    <p>
                        <Trans
                            t={t}
                            i18nKey="intro-p-2"
                            defaults="With its rather simplified interface and feature set, you’ll hopefully be able to accomplish your communication- and collaboration-related tasks rather efficiently and effortlessly, all in one place."
                        />
                    </p>
                </div>

                <hr />

                <div>
                    <h3>{t('Features')}</h3>
                    {/*
                    <ul className="list-disc list-inside">
                    */}
                    <ul className="list-['\2013\0020'] list-inside">
                        <li>{t('real-time messaging')}</li>
                        <li>{t('private and group chats')}</li>
                        <li>{t('sending and receiving files')}</li>
                        <li>{t('audio/video conferencing')}</li>
                        <li>{t('screen sharing and spectating')}</li>
                        <li>{t('collaborative writing/editing')}</li>
                        <li>{t('collaborative drawing/sketching')}</li>
                        <li>{t('exploring structures and content')}</li>
                    </ul>
                </div>

                <hr />

                <div>
                    <h3>{t('Terms & Conditions / Community Guidelines')}</h3>
                    <p>
                        <Trans
                            t={t}
                            i18nKey="terms-and-guidelines"
                            /* @NOTE: not sure if <a href="..." /> works inside <Trans /> ? */
                            defaults='By using this app, you agree to the <a href="/terms">Terms & Conditions</a> and <a href="/community-guidelines">Community Guidelines</a>.'
                            components={{ a: <a href /> }}
                        />
                    </p>
                </div>

                <hr />

                <div>
                    <h3>{t('Onboarding')}</h3>
                    <p>
                        <Trans
                            t={t}
                            i18nKey="onboarding-p-1"
                            defaults="To get started, simply click the <strong>Start Onboarding</strong> button below. You’ll be guided through the setup process, and you’ll be ready to use the app in no time."
                            components={{ bold: <strong /> }}
                        />
                    </p>
                    <Button
                        className="bg-accent-foreground text-white hover:bg-accent disabled:bg-muted"
                        onClick={() => {
                            onboarding.startTour();
                        }}
                    >
                        {t('Start Onboarding')}
                    </Button>
                </div>

                <hr />

                <div>
                    <h3>{t('Learn more')}</h3>
                    <p>
                        <Trans
                            t={t}
                            i18nKey="learn-more"
                            /* @NOTE: not sure if <a href="..." /> works inside <Trans /> ? */
                            defaults='To learn more about the app, visit our <a href="/help">Help Center</a>. You will, rather sooner than later, find detailed guides, tutorials, and troubleshooting tips to help you make the most of the app.'
                            components={{ a: <a href />, bold: <strong /> }}
                        />
                    </p>
                </div>
            </DefaultLayout.LameColumn>
        </>
    );
}
