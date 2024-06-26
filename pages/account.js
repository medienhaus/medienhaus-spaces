import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import getConfig from 'next/config';
import { Trans, useTranslation } from 'react-i18next';
import { filter, map } from 'lodash';
import { styled } from 'styled-components';

import { useAuth } from '@/lib/Auth';
import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';
import DefaultLayout from '@/components/layouts/default';
import { Input } from '@/components/UI/shadcn/Input';
import { Button } from '@/components/UI/shadcn/Button';
import { useOnboarding } from '@/components/onboarding/onboardingContext';

const AccountSection = styled(DefaultLayout.LameColumn)`
    /* TODO: these kind of layout spacings probably need to
   * be refined across all pages once merged into main */

    > * + * {
        margin-top: calc(var(--margin) * var(--line-height) * 2);
    }

    > * > * + * {
        margin-top: calc(var(--margin) * var(--line-height));
    }

    /* NOTE: selector for the email confirmation page form */
    form {
        > * + * {
            margin-top: var(--margin);
        }
    }
`;

const AvatarSection = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: var(--margin);
`;

const Avatar = styled.img`
    &.placeholder {
        -webkit-backdrop-filter: invert(100%);
        backdrop-filter: invert(100%);
        height: 6rem;
        width: 6rem;
    }
`;

const AvatarButtonContainer = styled.div`
    display: grid;
    grid-auto-flow: row;
    grid-gap: var(--margin);
    align-content: start;
`;

const ProfileSection = styled.form`
    > * + * {
        margin-top: var(--margin);
    }
`;

export default function Account() {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = matrix.getMatrixClient();

    const { t } = useTranslation('account');
    const router = useRouter();

    const [profileInfo, setProfileInfo] = useState({});
    const [emails, setEmails] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [hasToConfirmNewEmail, setHasToConfirmNewEmail] = useState(false);
    const [isSavingChanges, setIsSavingChanges] = useState(false);
    const [isChangingAvatar, setIsChangingAvatar] = useState(false);

    const [inputDisplayname, setInputDisplayname] = useState('');
    const [inputNewEmail, setInputNewEmail] = useState('');
    const [inputPassword, setInputPassword] = useState('');

    const [feedbackMessage, setFeedbackMessage] = useState(null);

    const avatarFileUploadInput = useRef(null);

    const onboarding = useOnboarding();

    const fetchEmails = useCallback(async () => {
        setEmails(map(filter((await matrixClient.getThreePids()).threepids, { medium: 'email' }), 'address'));
    }, [matrixClient]);

    const fetchProfileInfo = useCallback(async () => {
        const profileInfo = await matrixClient.getProfileInfo(matrixClient.getUserId());
        setProfileInfo(profileInfo);
        setInputDisplayname(profileInfo.displayname);
    }, [matrixClient]);

    const uploadAvatar = async (event) => {
        setIsChangingAvatar(true);
        const uploadResponse = await matrixClient.uploadContent(event.target.files[0], { onlyContentUri: false });
        if (!uploadResponse.content_uri) return;
        await matrixClient.setAvatarUrl(uploadResponse.content_uri);
        await fetchProfileInfo();
        setIsChangingAvatar(false);
    };

    const deleteAvatar = async () => {
        setIsChangingAvatar(true);
        await matrixClient.setAvatarUrl('');
        await fetchProfileInfo();
        setIsChangingAvatar(false);
    };

    const saveChanges = async () => {
        if (isSavingChanges) return;

        setFeedbackMessage(null);
        setIsSavingChanges(true);

        // Save display name if changed
        if (profileInfo.displayname !== inputDisplayname) {
            await matrixClient.setDisplayName(inputDisplayname);
            await fetchProfileInfo();
        }

        // Add new email if provided
        if (inputNewEmail) {
            const secretResponse = await matrixClient.generateClientSecret();
            const emailToken = await matrixClient
                .requestAdd3pidEmailToken(inputNewEmail, secretResponse, 1, `${window.location}?secret=${secretResponse}`)
                .catch(
                    /** @param {MatrixError} error */ (error) => {
                        setFeedbackMessage(error.data.error);
                    },
                );

            // Request is done, so we can set the state to false.
            setIsSavingChanges(false);

            // If the request was not successful, we return out of the function.
            if (!emailToken) return;

            // If the request was successful, a confirmation email will be sent to the user.
            setInputNewEmail('');
            setFeedbackMessage(t('We have sent a confirmation email to the provided address.'));
        }
    };

    const handleCancel = () => {
        setInputDisplayname(profileInfo.displayname);
        setInputNewEmail('');
    };

    const confirmNewEmail = async () => {
        if (isSavingChanges) return;

        setIsSavingChanges(true);

        // see https://spec.matrix.org/v1.2/client-server-api/#post_matrixclientv3account3pidadd
        const threePidConfirmObject = {
            sid: router.query.sid,
            client_secret: router.query.secret,
            auth: {
                type: 'm.login.password',
                user: matrixClient.getUserId(),
                identifier: {
                    type: 'm.id.user',
                    user: matrixClient.getUserId(),
                },
                password: inputPassword,
            },
        };

        await matrixClient
            .addThreePidOnly(threePidConfirmObject)
            .then(() => {
                router.push('/account');
            })
            .catch(
                /** @param {MatrixError} error */ (error) => {
                    setFeedbackMessage(error.data.error);
                },
            )
            .finally(() => {
                setIsSavingChanges(false);
            });
    };

    useEffect(() => {
        (async () => {
            await fetchEmails();
            await fetchProfileInfo();
            setIsLoading(false);

            // Check if the user clicked an email validation link (see saveChanges()), which we now might need to handle
            setHasToConfirmNewEmail(router.query?.sid && router.query?.secret);
        })();
    }, [fetchEmails, fetchProfileInfo, router.query?.secret, router.query?.sid]);

    if (isLoading) return null;

    if (hasToConfirmNewEmail) {
        return (
            <AccountSection>
                <div>
                    <h2>/account</h2>
                    <p>{t('Please enter your account password to confirm adding the given email address:')}</p>
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            confirmNewEmail();
                        }}
                        onReset={() => setInputPassword('')}
                    >
                        <Input
                            type="password"
                            placeholder={t('Password')}
                            onChange={(event) => {
                                setInputPassword(event.target.value);
                            }}
                        />
                        <ConfirmCancelButtons disabled={isSavingChanges} />
                    </form>
                    {feedbackMessage && <p>❗️ {feedbackMessage}</p>}
                </div>
            </AccountSection>
        );
    }

    return (
        <AccountSection>
            <div>
                <h2>/account</h2>
                <p>
                    <Trans
                        t={t}
                        i18nKey="introduction"
                        defaults="Here you can modify your display name and profile image, which might be shared with other accounts when, for example, interacting with them via <bold>/chat</bold>, <bold>/write</bold>, or <bold>/sketch</bold>."
                        components={{ bold: <strong /> }}
                    />
                </p>
            </div>
            <div>
                <h3>{t('Avatar — Profile Image')}</h3>
                <AvatarSection>
                    {profileInfo.avatar_url ? (
                        // Render the avatar if we have one
                        <Avatar src={matrixClient.mxcUrlToHttp(profileInfo.avatar_url, 500, 500, 'crop')} />
                    ) : (
                        // Render an empty GIF if we don't have an avatar
                        <Avatar
                            className="placeholder"
                            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                        />
                    )}
                    <AvatarButtonContainer>
                        <Input
                            type="file"
                            onChange={uploadAvatar}
                            ref={avatarFileUploadInput}
                            style={{ display: 'none' }}
                            accept="image/*"
                        />
                        <Button
                            type="button"
                            disabled={isChangingAvatar}
                            onClick={() => {
                                avatarFileUploadInput.current.click();
                            }}
                        >
                            {t('Browse')} …
                        </Button>
                        {profileInfo.avatar_url && (
                            <Button type="button" variant="destructive" disabled={isChangingAvatar} onClick={deleteAvatar}>
                                {t('Delete')}
                            </Button>
                        )}
                    </AvatarButtonContainer>
                </AvatarSection>
            </div>
            <div>
                <h3>{t('Display Name & Email Addresses')}</h3>
                <ProfileSection
                    onSubmit={(e) => {
                        e.preventDefault();
                        saveChanges();
                    }}
                    onReset={handleCancel}
                >
                    <Input
                        type="text"
                        value={inputDisplayname}
                        disabled={isSavingChanges}
                        placeholder={matrixClient.getUserId()}
                        onChange={(event) => {
                            setInputDisplayname(event.target.value);
                        }}
                    />
                    {profileInfo.displayname !== inputDisplayname && (
                        <ConfirmCancelButtons disabled={isSavingChanges} confirmLabel={t('Save')} />
                    )}
                    {emails.map((email) => (
                        <Input key={email} type="email" value={email} disabled />
                    ))}
                    {!!getConfig().publicRuntimeConfig.account?.allowAddingNewEmails && (
                        <Input
                            type="email"
                            value={inputNewEmail}
                            disabled={isSavingChanges}
                            placeholder={`${t('add ' + (emails.length ? 'another' : 'your') + ' email address')}...`}
                            onChange={(event) => {
                                setInputNewEmail(event.target.value);
                            }}
                        />
                    )}
                    {inputNewEmail && <ConfirmCancelButtons disabled={isSavingChanges} confirmLabel={t('Save')} />}
                    {feedbackMessage && <p>❗️ {feedbackMessage}</p>}
                </ProfileSection>
            </div>
            {onboarding?.active === false && (
                <div>
                    <h3>{t('Onboarding')}</h3>
                    <Button
                        className="bg-accent-foreground text-white hover:bg-accent disabled:bg-muted"
                        onClick={() => {
                            onboarding.startTour();
                        }}
                    >
                        {t('Start Onboarding')}
                    </Button>
                </div>
            )}
        </AccountSection>
    );
}
