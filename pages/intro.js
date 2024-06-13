import { Trans, useTranslation } from 'react-i18next';
import getConfig from 'next/config';

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
                            defaults="Welcome to the <bold>/spaces</bold> beta version. The application shall provide a rather seamless and enjoyable experience around several embedded services/tools (see features below)."
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
                    <ul className="list-inside list-['\2013\0020']">
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

                {getConfig().publicRuntimeConfig.intro && (
                    <>
                        <div>
                            <h3>
                                {t('Terms & Conditions')} / {t('Community Guidelines')}
                            </h3>
                            <p>
                                <Trans
                                    t={t}
                                    i18nKey="terms-and-guidelines"
                                    defaults="By using this app, you agree to the Terms & Conditions and Community Guidelines linked below."
                                />
                                <ul className="mt-4 list-inside list-['\2013\0020']">
                                    <li>
                                        {/* @NOTE: this shall be an external link to the terms and conditions website, hence using <a href="..." /> */}
                                        <a href="/terms-and-conditions" rel="external nofollow noreferrer">
                                            {t('Terms & Conditions')}
                                        </a>
                                    </li>
                                    <li>
                                        {/* @NOTE: this shall be an external link to the community guidelines, hence using <a href="..." /> */}
                                        <a href="/community-guidelines" rel="external nofollow noreferrer">
                                            {t('Community Guidelines')}
                                        </a>
                                    </li>
                                </ul>
                            </p>
                        </div>

                        <hr />
                    </>
                )}

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
                            i18nKey="learn-more-p-1"
                            defaults="To learn more about the app, visit the "
                            components={{ bold: <strong /> }}
                        />
                        {/* @NOTE: this shall be an external link to the help website, hence using <a href="..." /> */}
                        <a href="/help" rel="external nofollow noreferrer">
                            {t('help pages')}
                        </a>
                        .
                        <Trans
                            t={t}
                            i18nKey="learn-more-p-2"
                            defaults="You will, rather sooner than later, find detailed guides, tutorials, and troubleshooting tips to help you make the most of the app."
                        />
                    </p>
                </div>
            </DefaultLayout.LameColumn>
        </>
    );
}
