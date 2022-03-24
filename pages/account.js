import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { filter, map } from 'lodash';
import styled from 'styled-components';

import { useAuth } from '../lib/Auth';

const AvatarSection = styled.div`
  display: grid;
  grid-gap: calc(var(--margin) * 1.3);
  grid-template-columns: auto 1fr;
`;

const Avatar = styled.img`
  background: var(--color-fg);
  border-color: var(--color-fg);
  border-style: solid;
  border-width: calc(var(--margin) * 0.2);
  display: block;
  grid-column: 1;
  grid-row: 1;
  height: calc(var(--margin) * 7);
  margin-bottom: var(--margin);
  width: 0 calc(var(--margin) * 0.75);
`;

const AvatarButtonContainer = styled.div`
  grid-column: 2;
  grid-row: 1;
`;

export default function Account() {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = matrix.getMatrixClient();

    const { t } = useTranslation('account');

    const [isLoading, setIsLoading] = useState(true);
    const [profileInfo, setProfileInfo] = useState({});
    const [emails, setEmails] = useState([]);

    const [isSavingChanges, setIsSavingChanges] = useState(false);
    const [isChangingAvatar, setIsChangingAvatar] = useState(false);

    const [inputDisplayname, setInputDisplayname] = useState('');
    const [inputNewEmail, setInputNewEmail] = useState('');

    const avatarFileUploadInput = useRef(null);

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

        setIsSavingChanges(true);
        // Save display name if changed
        if (profileInfo.displayname !== inputDisplayname) {
            await matrixClient.setDisplayName(inputDisplayname);
            await fetchProfileInfo();
        }
        // Add new email if provided
        if (inputNewEmail) {
            // @TODO
        }
        setIsSavingChanges(false);
    };

    useEffect(() => {
        (async () => {
            setEmails(map(filter((await matrixClient.getThreePids()).threepids, { medium: 'email' }), 'address'));
            await fetchProfileInfo();
            setIsLoading(false);
        })();
    }, [fetchProfileInfo, matrixClient]);

    if (isLoading) return null;

    return (
        <>
            <h1>/account</h1>
            <AvatarSection>
                <Avatar src={profileInfo.avatar_url ? matrixClient.mxcUrlToHttp(profileInfo.avatar_url, 500, 500, 'crop') : 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='} />
                <AvatarButtonContainer>
                    <input type="file" onChange={uploadAvatar} ref={avatarFileUploadInput} style={{ display: 'none' }} accept="image/*" />
                    <button type="button" disabled={isChangingAvatar} onClick={() => { avatarFileUploadInput.current.click(); }}>{ t('Upload avatar') } ...</button>
                    { profileInfo.avatar_url && (
                        <button type="button" disabled={isChangingAvatar} onClick={deleteAvatar}>{ t('Delete') }</button>
                    ) }
                </AvatarButtonContainer>
            </AvatarSection>
            <form onSubmit={(e) => { e.preventDefault(); saveChanges(); }}>
                <input
                    type="text"
                    value={inputDisplayname}
                    disabled={isSavingChanges}
                    onChange={(event) => { setInputDisplayname(event.target.value); }}
                />
                { emails.length ? (
                    emails.map((email, index) => (
                        <input type="email" value={email} disabled />
                    ))
                ) : (
                    <input
                        type="email"
                        value={inputNewEmail}
                        disabled={isSavingChanges}
                        placeholder={`${t('Add your email address')}...`}
                        onChange={(event) => { setInputNewEmail(event.target.value); }}
                    />
                ) }
                { (
                    profileInfo.displayname !== inputDisplayname ||
                    inputNewEmail
                ) && (
                    <button type="submit" disabled={isSavingChanges}>{ t('Save changes') }</button>
                ) }
            </form>
        </>
    );
}
