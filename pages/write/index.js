/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';

import { Loading } from '../../components/UI/loading';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
// import WriteAuthProvider from '../../lib/auth/WriteAuthProvider';
import LoadingSpinnerButton from '../../components/UI/loadingSpinnerButton';
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

    if (!serviceSpaceId) return <Loading />;

    const createAnonymousPad = async () => {
        let string = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';

        const charactersLength = characters.length;
        for (let i = 0; i < 20; i++) {
            string += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        const link = getConfig().publicRuntimeConfig.writeUrl + '/' + string;

        console.log('creating room for ' + newPadName);
        const room = await matrix.createRoom(newPadName, false, '', 'invite', 'content', 'link');
        await auth.getAuthenticationProvider('matrix').addSpaceChild(serviceSpaceId, room).catch(console.log);
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: link,
        }).catch(console.log);
        setActionSelect('');
    };

    const addExistingPad = async () => {
        console.log('creating room for ' + newPadName);
        const room = await matrix.createRoom(newPadName, false, '', 'invite', 'content', 'link');
        await auth.getAuthenticationProvider('matrix').addSpaceChild(serviceSpaceId, room).catch(console.log);
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: newPadLink,
        }).catch(console.log);
        ('');
    };

    const handleExistingPad = (e) => {
        if (e.target.value.includes(getConfig().publicRuntimeConfig.writeUrl)) setValidLink(true);
        else setValidLink(false);
        setNewPadLink(e.target.value);
    };

    const createPasswordPad = async () => {
        console.log(write.getAllPads());
        const padId = await write.createPad(newPadName, 'private', password);
        console.log(padId);

        const link = 'https://pad.klasseklima.dev/p/' + padId;

        console.log('creating room for ' + newPadName);
        const room = await matrix.createRoom(newPadName, false, '', 'invite', 'content', 'link');
        await auth.getAuthenticationProvider('matrix').addSpaceChild(serviceSpaceId, room).catch(console.log);
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: link,
        }).catch(console.log);
        setActionSelect('');
        setNewPadName('');
        setPassword('');
        setValidatePassword('');
    };

    const renderSelectedOption = () => {
        switch (actionSelect) {
            case 'anonymousPad':
                return (<>
                    <input type="text" placeholder="pad name" value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <LoadingSpinnerButton type="submit" disabled={!newPadName} onClick={createAnonymousPad}>Create pad</LoadingSpinnerButton>
                </>);
            case 'existingPad':
                return (<>
                    <input type="text" placeholder="pad name" value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <input type="text" placeholder="link to pad" value={newPadLink} onChange={handleExistingPad} />
                    { !validLink && <span>make sure your link includes:  { getConfig().publicRuntimeConfig.writeUrl }</span> }
                    <LoadingSpinnerButton type="submit" disabled={!newPadName || !newPadLink ||!validLink} onClick={addExistingPad}>Add existing pad</LoadingSpinnerButton>
                </>);
            case 'passwordPad':
                return (<>
                    <input type="text" placeholder="pad name" value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <input type="password" placeholder="validate password" value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
                    <LoadingSpinnerButton type="submit" disabled={!newPadName || !password || password !== validatePassword} onClick={createPasswordPad}>Add pad</LoadingSpinnerButton>
                </>);
            default:
                return (null);
        }
    };

    const handleCloseButtonClick = () => {
        setOpenActions(openActions => !openActions);
        if (openActions) setActionSelect('');
    };

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
                    <li><a value="anonymousPad" onClick={() => setActionSelect('anonymousPad')}>Create new anonymous pad</a></li>
                    <li><a value="existingPad" onClick={() => setActionSelect('existingPad')}>Add an existing pad</a></li>
                    <li><a value="passwordPad" onClick={() => setActionSelect('passwordPad')}>Create password protected pad</a></li>
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
