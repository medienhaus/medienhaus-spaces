import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import FolderPlus from '../../assets/icons/folder-plus.svg';
import ErrorMessage from '../../components/UI/ErrorMessage';
import TextButton from '../../components/UI/TextButton';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const FloatContentRight = styled.div`
  display: flex;
  justify-content: end;
`;

const CreateNewFolder = ({ serviceSpaceId, callback }) => {
    const [newFolderName, setNewFolderName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [addNewFolder, setAddNewFolder] = useState(false);
    const { t } = useTranslation('s');
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const createNewFolder = async () => {
        setLoading(true);
        //@TODO should folders be created on both sketchdeck and matrix? should these be seperate cases, so you can also create folders that only exist in matrix for organisation?
        // Placeholder for /sketch code
        // await sketch.createFolder(newFolderName);
        // const updatedServerSketches = await sketch.syncAllSketches();
        // setServerSketches(updatedServerSketches);
        // Placeholder for matrix code
        const space = await matrix.createRoom(newFolderName, true, '', 'invite', 'item').catch(() => {
            setErrorMessage(t('Something went wrong when trying to create a new space'));
        });
        await auth.getAuthenticationProvider('matrix').addSpaceChild(serviceSpaceId, space).catch(() => {
            setErrorMessage(t('Couldn\'t add the new room to your folder'));
        });
        // const link = getConfig().publicRuntimeConfig.authProviders.sketch.baseUrl + 'spaces/' + folder._id;
        setNewFolderName('');
        setLoading(false);
    };

    return (
        <section>
            <FloatContentRight>
                <TextButton onClick={() => setAddNewFolder(prevState => !prevState)}>
                    <FolderPlus fill="var(--color-fg)" />
                </TextButton>
            </FloatContentRight>
            { addNewFolder &&
                <form onSubmit={(e) => {
                    e.preventDefault();
                    createNewFolder();
                    callback && callback();
                }}>
                    <input type="text" placeholder={t('folder name')} value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
                    <button type="submit" disabled={!newFolderName}>{ loading ? <LoadingSpinner inverted /> : t('Create new folder') }</button>
                    { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
                </form> }
        </section>
    );
};
export default CreateNewFolder;
