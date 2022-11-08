import { useCallback, useEffect, useState } from 'react';
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
import Plus from '../../assets/icons/plus.svg';
import ErrorMessage from '../../components/UI/ErrorMessage';
import TextButton from '../../components/UI/TextButton';
import FrameView from '../../components/FrameView';
import MultiColumnLayout from '../../components/layouts/multicolumn';

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

const PlusIcon = styled(Plus)`
  fill: var(--color-fg);
`;

const CloseIcon = styled(PlusIcon)`
  transform: rotate(45deg);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CloseButton = styled.button`
  width: auto;
  padding: 0;
  margin: 0;
  background: none;
  border: none;
`;

const WriteNavigation = styled.ul`
  margin-bottom: calc(var(--margin) * 3);
  list-style: none;

  li {
    margin-bottom: calc(var(--margin)/2);

    a[disabled] {
      color: var(--color-me);
      text-decoration: none;
      cursor: not-allowed;
    }
  }
`;

export default function Write() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation('write');
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
    const [openActions, setOpenActions] = useState(false);
    const [serverPads, setServerPads] = useState({});
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState(matrix.roomContents.get(roomId));

    const write = auth.getAuthenticationProvider('write');

    useEffect(() => {
        let cancelled = false;

        const startLookingForFolders = async () => {
            if (matrix.initialSyncDone) {
                try {
                    setServiceSpaceId(matrix.serviceSpaces.write);
                } catch (err) {
                    console.log(err);
                }
            }
        };
        !cancelled && startLookingForFolders();

        return () => {
            cancelled = true;
        };
    }, [matrix.initialSyncDone, matrix.serviceSpaces.write]);

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
    }, [syncServerPadsAndSet, write]);

    const syncServerPadsAndSet = useCallback(async () => {
        await write.syncAllPads().catch(() => setServerPads(null));
        setServerPads(write.getAllPads());
    }, [write]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const handleCloseButtonClick = () => {
        setOpenActions(openActions => !openActions);
        if (openActions) setActionSelect('');
    };

    if (!serviceSpaceId) return <LoadingSpinner />;

    return (
        <>
            <SidebarColumn>
                { roomId && <MultiColumnLayout.ColumnMobileHead><Link href="/write">/write</Link></MultiColumnLayout.ColumnMobileHead> }
                <>
                    <Header>
                        <h1>/write</h1>
                        <CloseButton onClick={handleCloseButtonClick}>
                            { (openActions ? <CloseIcon /> : <PlusIcon />) }
                        </CloseButton>
                    </Header>

                    { openActions && (
                        <>
                            <WriteNavigation>
                                <li><TextButton onClick={() => setActionSelect('existingPad')}>{ t('Add existing pad') }</TextButton></li>
                                <li><TextButton onClick={() => setActionSelect('anonymousPad')}>{ t('Create new anonymous pad') }</TextButton></li>
                                { getConfig().publicRuntimeConfig.authProviders.write.api && <li><TextButton disabled={!serverPads} onClick={() => setActionSelect('authoredPad')}>{ t('Create new authored pad') }</TextButton></li> }
                                { getConfig().publicRuntimeConfig.authProviders.write.api && <li><TextButton disabled={!serverPads} onClick={() => setActionSelect('passwordPad')}>{ t('Create password protected pad') }</TextButton></li> }
                            </WriteNavigation>
                            { renderSelectedOption() }
                        </>
                    ) }
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
