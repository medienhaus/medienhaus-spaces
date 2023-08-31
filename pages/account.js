import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';
import { filter, map } from 'lodash';
import styled from 'styled-components';

import { useAuth } from '../lib/Auth';

const ProfileSection = styled.div`
  display: grid;
  grid-template-columns: max-content 1fr;
  grid-gap: calc(var(--margin) * 1.3);

  & > form {
    grid-row: 2 / 3;
    grid-column: 1 / -1;
  }

  & > form > * + * {
    margin-top: calc(var(--margin) * 1.3);
  }

  @media (min-width: 40em) {
    & > form {
      grid-row: 2 / 3;
      grid-column: 2;
    }
  }
`;

const Avatar = styled.img`
  display: block;
  grid-row: 1 / 2;
  grid-column: 1;
  width: calc(var(--margin) * 7.3);
  aspect-ratio: 1;

  /*
  background: var(--color-foreground);
  border-color: var(--color-foreground);
  border-style: solid;
  border-width: calc(var(--margin) * 0.2);
  */

  &.placeholder {
    backdrop-filter: invert(100%);
  }

  @media (min-width: 40em) {
    grid-row: 1 / 3;
    width: calc(var(--margin) * 11.6);
  }
`;

const AvatarButtonContainer = styled.div`
  display: grid;
  grid-gap: calc(var(--margin) * 1.3);

  @media (min-width: 40em) {
    grid-template-columns: repeat(auto-fit, minmax(calc(50% - (var(--margin) * 0.65)), 1fr));
    grid-row: 1;
    grid-column: 2;
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
            await matrixClient.requestAdd3pidEmailToken(inputNewEmail, secretResponse, 1, `${window.location}?secret=${secretResponse}`);
            // Now an email will be sent to the user, in which they have to click on a validation link
            setInputNewEmail('');
            setFeedbackMessage(t('We have sent an email to the provided address. Please click the link in it in order to verify that you really own the given address.'));
        }
        setIsSavingChanges(false);
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

        await matrixClient.addThreePidOnly(threePidConfirmObject)
            .then(() => {
                router.push('/account');
            })
            .catch(/** @param {MatrixError} error */(error) => {
                setFeedbackMessage(error.message);
            })
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
            <>
                <h2>/account</h2>
                <p>{ t('Please enter your account password to confirm adding the given email address to your account:') }</p>
                <br />
                <form onSubmit={(event) => { event.preventDefault(); confirmNewEmail(); }}>
                    <input type="password" placeholder={t('password')} onChange={(event) => { setInputPassword(event.target.value);}} />
                    <button type="submit" disabled={isSavingChanges}>{ t('Confirm') }</button>
                </form>
                { feedbackMessage && (<p>❗️ { feedbackMessage }</p>) }
            </>
        );
    }

    return (
        <>
            <h2>/account</h2>
            <ProfileSection>
                { profileInfo.avatar_url ? (
                    // Render the avatar if we have one
                    <Avatar src={matrixClient.mxcUrlToHttp(profileInfo.avatar_url, 500, 500, 'crop')} />
                ) : (
                    // Render an empty GIF if we don't have an avatar
                    <Avatar className="placeholder" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
                ) }
                <AvatarButtonContainer>
                    <input type="file" onChange={uploadAvatar} ref={avatarFileUploadInput} style={{ display: 'none' }} accept="image/*" />
                    <button type="button" disabled={isChangingAvatar} onClick={() => { avatarFileUploadInput.current.click(); }}>{ t('Upload') } …</button>
                    { profileInfo.avatar_url && (
                        <button type="button" disabled={isChangingAvatar} onClick={deleteAvatar}>{ t('Delete') }</button>
                    ) }
                </AvatarButtonContainer>
                <form onSubmit={(e) => { e.preventDefault(); saveChanges(); }}>
                    <input
                        type="text"
                        value={inputDisplayname}
                        disabled={isSavingChanges}
                        placeholder={matrixClient.getUserId()}
                        onChange={(event) => { setInputDisplayname(event.target.value); }}
                    />
                    { emails.map((email, index) => (
                        <input key={email} type="email" value={email} disabled />
                    )) }
                    { !!getConfig().publicRuntimeConfig.account?.allowAddingNewEmails && (
                        <input
                            type="email"
                            value={inputNewEmail}
                            disabled={isSavingChanges}
                            placeholder={`${t('add ' + (emails.length ? 'another' : 'your') + ' email address')}...`}
                            onChange={(event) => { setInputNewEmail(event.target.value); }}
                        />
                    ) }
                    { (
                        profileInfo.displayname !== inputDisplayname ||
                        inputNewEmail
                    ) && (
                        <button type="submit" disabled={isSavingChanges}>{ t('Save changes') }</button>
                    ) }
                    { feedbackMessage && (<p>❗️ { feedbackMessage }</p>) }
                </form>
            </ProfileSection>
        </>
    );
}
