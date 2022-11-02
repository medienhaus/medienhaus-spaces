/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import _ from 'lodash';
import { useRouter } from 'next/router';
import Link from 'next/link';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import WriteListEntry from './WriteListEntry';
import ErrorMessage from '../../components/UI/ErrorMessage';
import TextButton from '../../components/UI/TextButton';
import FrameView from '../../components/FrameView';
import MultiColumnLayout from '../../components/layouts/multicolumn';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';

const SidebarColumn = styled(MultiColumnLayout.Column)`
  @media (width > 51em) {
    width: 30ch;
    max-width: 30ch;
  }
`;

const IframeColumn = styled(MultiColumnLayout.Column)`
  max-width: unset;
  padding: 0;
`;

export default function Write() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrixSpaces = matrix.spaces.values();
    const { t } = useTranslation('write');
    const application = 'write';
    const router = useRouter();
    // A roomId is set when the route is /write/<roomId>, otherwise it's undefined
    const roomId = _.get(router, 'query.roomId.0');

    const [newPadName, setNewPadName] = useState('');
    const [newPadLink, setNewPadLink] = useState('');
    const [validLink, setValidLink] = useState('undefined');
    const [password, setPassword] = useState('');
    const [validatePassword, setValidatePassword] = useState('');
    const [actionSelect, setActionSelect] = useState('');
    const [serviceSpaceId, setServiceSpaceId] = useState();
    const [, setOpenActions] = useState(false);
    const [serverPads, setServerPads] = useState({});
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState(matrix.roomContents.get(roomId));

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
        let cancelled = false;

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
        !cancelled && startLookingForFolders();

        return () => {
            cancelled = true;
        };
    }, [matrix.initialSyncDone]);

    useEffect(() => {
        let cancelled = false;

        !cancelled && setContent(matrix.roomContents.get(roomId));

        return () => cancelled = true;
    }, [matrix.roomContents, roomId]);

    useEffect(() => {
        let cancelled = false;

        const populatePadsfromServer = async () => {
            if (!_.isEmpty(write.getAllPads())) {
                setServerPads(write.getAllPads());
            } else {
                await syncServerPadsAndSet();
            }
        };
        !cancelled && getConfig().publicRuntimeConfig.authProviders.write.api && populatePadsfromServer();

        return () => {
            cancelled = true;
        };
    }, [write]);

    async function syncServerPadsAndSet() {
        await write.syncAllPads().catch(() => setServerPads(null));
        setServerPads(write.getAllPads());
    }

    useEffect(() => {
        let cancelled = false;

        const syncServerPadsWithMatrix = async () => {
            let matrixPads = {};
            if (matrix?.spaces.get(serviceSpaceId).children) {
                // if there are rooms within the space id we grab the names of those room
                for (const roomId of matrix.spaces.get(serviceSpaceId).children) {
                    // in order to get the actual id of the pad we need to check the room content
                    const id = matrix.roomContents.get(roomId).body.substring(matrix.roomContents.get(roomId).body.lastIndexOf('/') + 1);
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

        !cancelled && serviceSpaceId && serverPads && syncServerPadsWithMatrix();

        return () => cancelled = true;
    }, [serviceSpaceId, serverPads]);

    async function createWriteRoom(link = newPadLink, name = newPadName) {
        console.log('creating room for ' + name);
        const room = await matrix.createRoom(name, false, '', 'invite', 'content', 'link');
        await auth.getAuthenticationProvider('matrix').addSpaceChild(serviceSpaceId, room).catch(console.log);
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: link,
        }).catch(console.log);

        if (getConfig().publicRuntimeConfig.authProviders.write.api) {
            await write.syncAllPads();
            setServerPads(write.getAllPads());
        }
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

    const createAuthoredPad = async () => {
        setLoading(true);
        const padId = await write.createPad(newPadName, 'public').catch((err) => {
            console.log(err);
        });
        if (!padId) {
            setLoading(false);
            return;
        }
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
                    <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <button type="submit" disabled={!newPadName}>{ loading ? <LoadingSpinner inverted /> :t('Create pad') }</button>
                </form>);
            case 'existingPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createWriteRoom(); }}>
                    <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <input type="text" placeholder={t('link to pad')} value={newPadLink} onChange={handleExistingPad} />
                    { !validLink && <ErrorMessage>{ t('Make sure your link includes "{{url}}"', { url: getConfig().publicRuntimeConfig.authProviders.write.baseUrl }) }</ErrorMessage> }
                    <button type="submit" disabled={!newPadName || !newPadLink || !validLink}>{ loading ? <LoadingSpinner inverted /> :t('Add existing pad') }</button>
                </form>);
            case 'passwordPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createPasswordPad(); }}>
                    <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <input type="password" placeholder={t('confirm password')} value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
                    <button type="submit" disabled={!newPadName || !password || password !== validatePassword}>{ loading ? <LoadingSpinner inverted /> :t('Create pad') }</button>
                </form>);
            case 'authoredPad':
                return (<form onSubmit={(e) => { e.preventDefault(); createAuthoredPad(); }}>
                    <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
                    <button type="submit" disabled={!newPadName}>{ loading ? <LoadingSpinner inverted /> : t('Create pad') }</button>
                </form>);
            default:
                return (null);
        }
    };

    // this replaces the `renderSelectedOption()` method inside of `write/index.js`
    const ActionNewAnonymousPad = (<form onSubmit={(e) => { e.preventDefault(); createAnonymousPad(); }}>
        <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
        <button type="submit" disabled={!newPadName}>{ loading ? <LoadingSpinner inverted /> :t('Create pad') }</button>
    </form>);

    const ActionExistingPad = (<form onSubmit={(e) => { e.preventDefault(); createWriteRoom(); }}>
        <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
        <input type="text" placeholder={t('link to pad')} value={newPadLink} onChange={handleExistingPad} />
        { !validLink && <ErrorMessage>{ t('Make sure your link includes "{{url}}"', { url: getConfig().publicRuntimeConfig.authProviders.write.baseUrl }) }</ErrorMessage> }
        <button type="submit" disabled={!newPadName || !newPadLink || !validLink}>{ loading ? <LoadingSpinner inverted /> : t('Add existing pad') }</button>
    </form>);

    const ActionPasswordPad = (<form onSubmit={(e) => { e.preventDefault(); createPasswordPad(); }}>
        <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
        <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="password" placeholder={t('confirm password')} value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
        <button type="submit" disabled={!newPadName || !password || password !== validatePassword}>{ loading ? <LoadingSpinner inverted /> :t('Create pad') }</button>
    </form>);
    const ActionAuthoredPad = (<form onSubmit={(e) => { e.preventDefault(); createAuthoredPad(); }}>
        <input type="text" placeholder={t('pad name')} value={newPadName} onChange={(e) => setNewPadName(e.target.value)} />
        <button type="submit" disabled={!newPadName}>{ loading ? <LoadingSpinner inverted /> : t('Create pad') }</button>
    </form>);

    <ServiceSubmenu.Item actionComponentToRender={ActionNewAnonymousPad}>{ t('Create new anonymous pad') }</ServiceSubmenu.Item>;

    if (!serviceSpaceId) return <LoadingSpinner />;

    return (
        <>
            <SidebarColumn>
                { roomId && <MultiColumnLayout.ColumnMobileHead><Link href="/write">/write</Link></MultiColumnLayout.ColumnMobileHead> }
                <>
                    <ServiceSubmenu title="/write">
                        <ServiceSubmenu.Toggle callback={() => setActionSelect('')} />
                        <ServiceSubmenu.List>
                            <ServiceSubmenu.Item actionComponentToRender={ActionNewAnonymousPad}>{ t('Add existing pad') }</ServiceSubmenu.Item>
                            <ServiceSubmenu.Item actionComponentToRender={ActionExistingPad}>{ t('Create new anonymous pad') }</ServiceSubmenu.Item>
                            { getConfig().publicRuntimeConfig.authProviders.write.api && <ServiceSubmenu.Item actionComponentToRender={ActionPasswordPad}>{ t('Create new authored pad') }</ServiceSubmenu.Item> }
                            { getConfig().publicRuntimeConfig.authProviders.write.api && <ServiceSubmenu.Item actionComponentToRender={ActionAuthoredPad}>{ t('Create password protected pad') }</ServiceSubmenu.Item> }
                        </ServiceSubmenu.List>
                    </ServiceSubmenu>
                    { getConfig().publicRuntimeConfig.authProviders.write.api && !serverPads && <ErrorMessage>{ t('Can\'t connect with the provided /write server. Please try again later.') }</ErrorMessage> }
                    <ul>
                        { matrix.spaces.get(serviceSpaceId).children?.map(roomId => {
                            return <WriteListEntry
                                key={roomId}
                                roomId={roomId}
                                parent={serviceSpaceId}
                                serverPads={serverPads}
                                callback={syncServerPadsAndSet}
                            />;
                        }) }
                    </ul>
                </>
            </SidebarColumn>
            { roomId && content && (
                <IframeColumn>
                    <FrameView link={content.body} />
                </IframeColumn>
            ) }
        </>
    );
}

Write.getLayout = () => {
    return MultiColumnLayout.Layout;
};
