/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';

import { Loading } from '../../components/UI/loading';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import LoadingSpinnerButton from '../../components/UI/loadingSpinnerButton';
import DisplayLinks from './DisplayLink';

const WriteView = styled.div`

`;

export default function Write() {
    const [newPadName, setNewPadName] = useState('');
    const [newPadLink, setNewPadLink] = useState('');
    const [validLink, setValidLink] = useState('undefined');
    const [dropdownSelection, setDropdownSelection] = useState('');
    const [serviceSpaceId, setServiceSpaceId] = useState();
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrixSpaces = matrix.spaces.values();
    const application = 'write';
    // const writeService = useServices('write', auth.getAuthenticationProvider('matrix'), matrix);

    // const writeFolder = useServices('write');

    // for (const space of matrix.spaces.values()) {
    //     if (space.name !== 'Applications') continue;
    //     matrixClient.leave(space.roomId);
    //     setTimeout(() => console.log('waiting'), 200);
    // }
    const lookForServiceFolder = async (applicationsSpaceId) => {
        const findServiceSpace = Array.from(matrix.spaces.values()).find(space => space.name === application);
        console.log(matrix.spaces);
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
        setDropdownSelection('');
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
    const renderSelectedOption = () => {
        switch (dropdownSelection) {
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
            default:
                return (null);
        }
    };

    console.log(matrix.spaces.get(serviceSpaceId));
    return (<WriteView>
        <h1>/write</h1>
        <select defaultValue="" onChange={(event) => setDropdownSelection(event.target.value)}>
            <option disabled value="">-- select option --</option>
            <option value="anonymousPad">Create new anonymous pad</option>
            <option value="existingPad">Add an existing pad</option>
        </select>
        { renderSelectedOption() }
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
