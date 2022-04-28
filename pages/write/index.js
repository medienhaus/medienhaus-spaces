/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { isEmpty } from 'lodash';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import DisplayLinks from './DisplayLink';
import Plus from '../../assets/icons/plus.svg';

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
    const [serverPads, setServerPads] = useState(null);
    const [loading, setLoading] = useState(false);

    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrixSpaces = matrix.spaces.values();
    const application = 'write';
    const { t } = useTranslation('write');

    const write = auth.getAuthenticationProvider('write');
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
        const populatePadsfromServer = async () => {
            if (!isEmpty(write.getAllPads())) {
                setServerPads(write.getAllPads());
            } else {
                await syncServerPadsAndSet();
            }
        };
        populatePadsfromServer();
    }, [write]);

    async function syncServerPadsAndSet() {
        await write.syncAllPads();
        setServerPads(write.getAllPads());
    }

    useEffect(() => {
        const syncServerPadsWithMatrix = async (params) => {
            let matrixPads = {};
            if (matrix?.spaces.get(serviceSpaceId).children) {
                // if there are rooms within the space id we grab the names of those room
                for (const roomId of matrix.spaces.get(serviceSpaceId).children) {
                // in order to get the actual id of the pad we need to check the room content
                    const id = matrix.roomContent.get(roomId).body.substring(matrix.roomContent.get(roomId).body.lastIndexOf('/') + 1);
                    matrixPads = Object.assign({}, matrixPads, {
                        [id]: {
                            name: matrix.rooms.get(roomId).name,
                            id: roomId,
                        },
                    });
                }
            }
            for (const pad of Object.values(serverPads)) {
                if (matrixPads[pad._id]) continue;
                const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + pad._id;
                await createWriteRoom(link, pad.name);
            }
        };

        serviceSpaceId && serverPads && syncServerPadsWithMatrix();
    }, [serviceSpaceId, serverPads]);

    async function createWriteRoom(link = newPadLink, name = newPadName) {
        console.log('creating room for ' + name);
        const room = await matrix.createRoom(name, false, '', 'invite', 'content', 'link');
        await auth.getAuthenticationProvider('matrix').addSpaceChild(serviceSpaceId, room).catch(console.log);
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: link,
        }).catch(console.log);

        await write.syncAllPads();
        setServerPads(write.getAllPads());
        setActionSelect('');
        setNewPadName('');
        setNewPadLink('');
        setPassword('');
        setValidatePassword('');
        setOpenActions(false);
    }

    const createAnonymousPad = async () => {
        setLoading(true);
        let string = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
        const charactersLength = characters.length;
        for (let i = 0; i < 20; i++) {
            string += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + string;
        await createWriteRoom(link);
        setLoading(false);
    };

    const createPasswordPad = async () => {
        setLoading(true);
        const padId = await write.createPad(newPadName, 'private', password);
        const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + padId;
        await createWriteRoom(link);
        setLoading(false);
    };

    const createAuthoredPad = async (params) => {
        setLoading(true);
        const padId = await write.createPad(newPadName, 'public');
        const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + padId;
        await createWriteRoom(link);
        setLoading(false);
    };

    const handleExistingPad = (e) => {
        setLoading(true);
        if (e.target.value.includes(getConfig().publicRuntimeConfig.authProviders.write.baseUrl)) setValidLink(true);
        else setValidLink(false);
        setNewPadLink(e.target.value);
        setLoading(false);
    };

    const renderSelectedOption = () => {
        switch (actionSelect) {
            case 'anonymousPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createAnonymousPad(); }}>
                    <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <button type="submit" disabled={!newPadName}>{ loading ? <LoadingSpinner inverted /> :t('Create pad') }</button>
                </form>);
            case 'existingPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createWriteRoom(); }}>
                    <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <input type="text" placeholder={t('link to pad')} value={newPadLink} onChange={handleExistingPad} />
                    { !validLink && <span>{ t('Make sure your link includes') }:  { getConfig().publicRuntimeConfig.authProviders.write.baseUrl }</span> }
                    <button type="submit" disabled={!newPadName || !newPadLink || !validLink}>{ loading ? <LoadingSpinner inverted /> :t('Add existing pad') }</button>
                </form>);
            case 'passwordPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createPasswordPad(); }}>
                    <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <input type="password" placeholder={t('validate password')} value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
                    <button type="submit" disabled={!newPadName || !password || password !== validatePassword}>{ loading ? <LoadingSpinner inverted /> :t('Create pad') }</button>
                </form>);
            case 'authoredPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createAuthoredPad(); }}>
                    <input type="text" placeholder="pad name" value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <button type="submit" disabled={!newPadName}>{ t('Create pad') }</button>
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
                <Plus fill="var(--color-fg)" style={{ transform: openActions && 'rotate(45deg)' }} />
            </CloseButton>
        </Header>
        { openActions && <>
            <nav>
                <ul>
                    <li><a value="existingPad" onClick={() => setActionSelect('existingPad')}>{ t('Add existing pad') }</a></li>
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
                serverPads={serverPads}
                callback={syncServerPadsAndSet}
            />;
        }) }
        { /*Debug */ }
        { /* <button onClick={() => write.deletePadById('pw-prtoect-3-tk2ocsi1')}>delete pad</button> */ }
    </WriteView>
    );
}
