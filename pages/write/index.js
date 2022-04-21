/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { isEmpty } from 'lodash';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
// import WriteAuthProvider from '../../lib/auth/WriteAuthProvider';
import LoadingSpinnerButton from '../../components/UI/LoadingSpinnerButton';
import DisplayLinks from './DisplayLink';
import Close from '../../assets/icons/close.svg';

const WriteView = styled.div`

`;

const Header = styled.div`
    display:flex;
    justify-content: space-between;
`;
const CloseButton = styled.a`
    display: flex;
    align-items: center;
`;
export default function Write() {
    const [newPadName, setNewPadName] = useState('');
    const [newPadLink, setNewPadLink] = useState('');
    const [validLink, setValidLink] = useState('undefined');
    const [password, setPassword] = useState('');
    const [validatePassword, setValidatePassword] = useState('');
    const [actionSelect, setActionSelect] = useState('');
    const [serviceSpaceId, setServiceSpaceId] = useState();
    const [openActions, setOpenActions] = useState(false);

    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrixSpaces = matrix.spaces.values();
    const application = 'write';
    const { t } = useTranslation('write');

    const write = auth.getAuthenticationProvider('write');
    // const writeService = useServices('write', auth.getAuthenticationProvider('matrix'), matrix);

    // const writeFolder = useServices('write');

    // for (const space of matrix.spaces.values()) {
    //     if (space.name !== 'Applications') continue;
    //     matrixClient.leave(space.roomId);
    //     setTimeout(() => console.log('waiting'), 200);
    // }
    const lookForServiceFolder = async (applicationsSpaceId) => {
        const findServiceSpace = Array.from(matrix.spaces.values()).find(space => space.name === application);
        if (findServiceSpace) return findServiceSpace.roomId;
        else {
            console.info('creating service space');
            const createRoom = await matrix.createRoom(
                application,
                true,
                `This is your private space for the application ${application}. You can find all your ${application} data in here.`,
                'invite',
                'context',
                'application');
            await auth.getAuthenticationProvider('matrix').addSpaceChild(applicationsSpaceId, createRoom);
            return createRoom;
        }
    };

    const lookForApplicationsFolder = async () => {
        const findApplicationsFolder = Array.from(matrixSpaces).find(space => space.meta?.template === 'applications');
        if (findApplicationsFolder) {
            console.info('found applications space');
            return findApplicationsFolder.roomId;
        } else {
            console.log('creating root applications folder');
            const newApplicationsFolder = await matrix.createRoom(
                'Applications',
                true,
                'This is your private applications space. You can find all your application data in here.',
                'invite',
                'context',
                'applications');
            return newApplicationsFolder;
        }
    };

    useEffect(() => {
        const startLookingForFolders = async () => {
            if (matrix.initialSyncDone) {
                try {
                    const applicationsSpaceId = await lookForApplicationsFolder();
                    const space = await lookForServiceFolder(applicationsSpaceId);
                    setServiceSpaceId(space);
                } catch (err) {
                    console.log(err);
                }
            }
        };
        startLookingForFolders();
    }, [matrix.initialSyncDone]);

    useEffect(() => {
        const syncPadServerWithSpaces = (serverPads) => {
            for (const pad of serverPads) {
                setNewPadName(serverPads[pad].name);
                createWriteRoom(getConfig().publicRuntimeConfig.writeUrl + '/' + serverPads[pad]._id);
            }
        };
        const populatePadsfromServer = async () => {
            // const serverPads = write.getAllPads();
            // if (isEmpty(serverPads)) serverPads);
            // else {
            //     await write.syncAllPads();
            //     setPadsOnServer(write.getAllPads());
            // }
            const serverPads = write.getAllPads();
            if (!isEmpty(serverPads)) {
                console.log(serverPads);
            } else {
                await write.syncAllPads();
                console.log(write.getAllPads());
            }
            console.log(serverPads);
        };
        populatePadsfromServer();
    }, [write]);

    async function createWriteRoom(link) {
        console.log('creating room for ' + newPadName);
        const room = await matrix.createRoom(newPadName, false, '', 'invite', 'content', 'link');
        await auth.getAuthenticationProvider('matrix').addSpaceChild(serviceSpaceId, room).catch(console.log);
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: newPadLink || link,
        }).catch(console.log);
        setActionSelect(null);
        setNewPadName(null);
        setPassword(null);
        setValidatePassword(null);
    }

    const createAnonymousPad = async () => {
        let string = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
        const charactersLength = characters.length;
        for (let i = 0; i < 20; i++) {
            string += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + string;
        await createWriteRoom(link);
    };

    const createPasswordPad = async () => {
        const padId = await write.createPad(newPadName, 'private', password);
        const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + padId;
        await createWriteRoom(link);
    };

    const createAuthoredPad = async (params) => {
        const padId = await write.createPad(newPadName, 'public');
        const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + padId;
        await createWriteRoom(link);
    };

    const handleExistingPad = (e) => {
        if (e.target.value.includes(getConfig().publicRuntimeConfig.authProviders.write.baseUrl)) setValidLink(true);
        else setValidLink(false);
        setNewPadLink(e.target.value);
    };

    const renderSelectedOption = () => {
        switch (actionSelect) {
            case 'anonymousPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createAnonymousPad(); }}>
                    <input type="text" placeholder="pad name" value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <LoadingSpinnerButton type="submit" disabled={!newPadName}>Create pad</LoadingSpinnerButton>
                </form>);
            case 'existingPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createWriteRoom(); }}>
                    <input type="text" placeholder="pad name" value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <input type="text" placeholder="link to pad" value={newPadLink} onChange={handleExistingPad} />
                    { !validLink && <span>make sure your link includes:  { getConfig().publicRuntimeConfig.authProviders.write.baseUrl }</span> }
                    <LoadingSpinnerButton type="submit" disabled={!newPadName || !newPadLink || !validLink}>Add existing pad</LoadingSpinnerButton>
                </form>);
            case 'passwordPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createPasswordPad(); }}>
                    <input type="text" placeholder="pad name" value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <input type="password" placeholder="validate password" value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
                    <LoadingSpinnerButton type="submit" disabled={!newPadName || !password || password !== validatePassword}>Create pad</LoadingSpinnerButton>
                </form>);
            case 'authoredPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createAuthoredPad(); }}>
                    <input type="text" placeholder="pad name" value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <LoadingSpinnerButton type="submit" disabled={!newPadName || !password || password !== validatePassword}>Create pad</LoadingSpinnerButton>
                </form>);
            default:
                return (null);
        }
    };

    const handleCloseButtonClick = () => {
        setOpenActions(openActions => !openActions);
        if (openActions) setActionSelect('');
    };
    if (!serviceSpaceId) return <LoadingSpinner />;

    return (<WriteView>
        <Header>
            <h1>/write</h1>
            <CloseButton onClick={handleCloseButtonClick}>
                <Close fill="var(--color-fg)" style={{ transform: openActions && 'rotate(45deg)' }} />
            </CloseButton>
        </Header>
        { openActions && <>
            <nav>
                <ul>
                    <li><a value="existingPad" onClick={() => setActionSelect('existingPad')}>{ t('Add an existing pad') }</a></li>
                    <li><a value="anonymousPad" onClick={() => setActionSelect('anonymousPad')}>{ t('Create new anonymous pad') }</a></li>
                    <li><a value="authoredPad" onClick={() => setActionSelect('authoredPad')}>{ t('Create new authored pad') }</a></li>
                    <li><a value="passwordPad" onClick={() => setActionSelect('passwordPad')}>{ t('Create password protected pad') }</a></li>
                </ul>
            </nav>
            { renderSelectedOption() }
        </>
        }
        { matrix.spaces.get(serviceSpaceId).children?.map(roomId => {
            return <DisplayLinks
                key={roomId}
                roomId={roomId}
                parent={serviceSpaceId}
            />;
        }) }
    </WriteView>
    );
}
