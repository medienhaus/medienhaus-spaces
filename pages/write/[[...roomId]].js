import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import _ from 'lodash';
import { useRouter } from 'next/router';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import WriteListEntry from './WriteListEntry';
import ErrorMessage from '../../components/UI/ErrorMessage';
import IframeLayout from '../../components/layouts/iframe';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import Bin from '../../assets/icons/bin.svg';
import Clipboard from '../../assets/icons/clipboard.svg';
import { ServiceTable } from '../../components/UI/ServiceTable';
import Form from '../../components/UI/Form';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Write() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const write = auth.getAuthenticationProvider('write');

    const { t } = useTranslation('write');
    const router = useRouter();
    const [serviceSpaceId, setServiceSpaceId] = useState();
    const [serverPads, setServerPads] = useState({});
    const [isDeletingPad, setIsDeletingPad] = useState(false);
    const [content, setContent] = useState(matrix.roomContents.get(roomId));

    /**
     * A roomId is set when the route is /write/<roomId>, otherwise it's undefined
     * @type {String|undefined}
     */
    const roomId = _.get(router, 'query.roomId.0');

    /**
     * If the currently visible pad can be accessed via the mypads API, this will be the mypads pad object; e.g.
     *
     * {
     *   "name": "Flo Authored Pad",
     *   "group": "udk-spaces-q420ibx",
     *   "users": [],
     *   "visibility": "public",
     *   "readonly": null,
     *   "_id": "flo-authored-pad-n230azd",
     *   "ctime": 1683553447118
     * }
     *
     * @type {{name: string, group: string, users: [], visibility: string, readonly, _id: string, ctime: number}|undefined}
     */
    const mypadsPadObject = roomId && content && content.body && serverPads[content.body.substring(content.body.lastIndexOf('/') + 1)];

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

        return () => { cancelled = true; };
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

        return () => { cancelled = true; };
        // if we add matrix[key] to the dependency array we end up creating infinite loops in the event of someone creating pads within mypads that are then synced here.
        // therefore we need to disable the linter for the next line
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceSpaceId, serverPads, createWriteRoom]);

    const copyToClipboard = () => navigator.clipboard.writeText(content.body);

    /**
     * Removes the given pad from the user's library, and also deletes the pad entirely via API if possible.
     */
    const deletePad = async () => {
        // Confirm if the user really wants to remove/delete this pad ...
        let confirmDeletionMessage;
        if (mypadsPadObject) {
            confirmDeletionMessage = t('Do you really want to delete this pad and all of its content?');
        } else {
            confirmDeletionMessage = t('Do you really want to remove this pad from your library?');
        }

        // ... and cancel the process if the user decided otherwise.
        if (!confirm(confirmDeletionMessage)) return;

        setIsDeletingPad(true);

        // If this pad is known by mypads we'll try to delete it altogether
        if (mypadsPadObject) {
            await write.deletePadById(mypadsPadObject._id);
        }

        await auth.getAuthenticationProvider('matrix').removeSpaceChild(serviceSpaceId, roomId);
        await matrix.leaveRoom(roomId);

        await syncServerPadsAndSet();

        router.push('/write');
        setIsDeletingPad(false);
    };

    const createWriteRoom = useCallback(async (link, name) => {
        // eslint-disable-next-line no-undef
        if (process.env.NODE_ENV === 'development') console.log('creating room for ' + name);
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

        return room;
    }, [auth, matrix, matrixClient, serviceSpaceId, write]);

    const ActionNewAnonymousPad = ({ callbackDone }) => {
        const [padName, setPadName] = useState('');
        const [isLoading, setIsLoading] = useState(false);

        const createAnonymousPad = async () => {
            setIsLoading(true);
            let string = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
            const charactersLength = characters.length;
            for (let i = 0; i < 20; i++) {
                string += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + string;
            const roomId = await createWriteRoom(link, padName);
            router.push(`/write/${roomId}`);

            callbackDone && callbackDone();
            setIsLoading(false);
            setPadName('');
        };

        return (
            <Form onSubmit={(e) => { e.preventDefault(); createAnonymousPad(padName); }}>
                <input type="text" placeholder={t('pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
                <button type="submit" disabled={!padName}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Create pad') }</button>
            </Form>
        );
    };

    const ActionExistingPad = ({ callbackDone }) => {
        const [padName, setPadName] = useState('');
        const [padLink, setPadLink] = useState('');
        const [validLink, setValidLink] = useState(false);
        const [isLoading, setIsLoading] = useState(false);

        const validatePadUrl = (e) => {
            if (e.target.value.includes(getConfig().publicRuntimeConfig.authProviders.write.baseUrl)) setValidLink(true);
            else setValidLink(false);
            setPadLink(e.target.value);
        };

        const handleExistingPadSubmit = async () => {
            const apiUrl = padLink.replace('/p/', '/mypads/api/pad/');
            const checkForPasswordProtection = await write.checkPadForPassword(apiUrl);
            console.log(checkForPasswordProtection);
            setIsLoading(true);
            const roomId = await createWriteRoom(padLink, padName);
            router.push(`/write/${roomId}`);

            callbackDone && callbackDone();
            setPadLink('');
            setIsLoading(false);
        };

        return (
            <Form onSubmit={(e) => { e.preventDefault(); handleExistingPadSubmit(); }}>
                <input type="text" placeholder={t('pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
                <input type="text" placeholder={t('link to pad')} value={padLink} onChange={validatePadUrl} />
                { !validLink && padLink && (
                    <ErrorMessage>
                        { t('Make sure your link includes "{{url}}"', { url: getConfig().publicRuntimeConfig.authProviders.write.baseUrl }) }
                    </ErrorMessage>
                ) }
                <button type="submit" disabled={!padName || !padLink || !validLink}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Add pad') }</button>
            </Form>);
    };

    const ActionPasswordPad = ({ callbackDone }) => {
        const [padName, setPadName] = useState('');
        const [password, setPassword] = useState('');
        const [validatePassword, setValidatePassword] = useState('');
        const [isLoading, setIsLoading] = useState(false);

        const createPasswordPad = async () => {
            setIsLoading(true);
            const padId = await write.createPad(padName, 'private', password);
            const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + padId;
            const roomId = await createWriteRoom(link, padName);
            router.push(`/write/${roomId}`);

            callbackDone && callbackDone();
            setPadName('');
            setIsLoading(false);
        };

        return (<Form onSubmit={(e) => { e.preventDefault(); createPasswordPad(); }}>
            <input type="text" placeholder={t('pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
            <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="password" placeholder={t('confirm password')} value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
            <button type="submit" disabled={!padName || !password || password !== validatePassword}>{ isLoading ? <LoadingSpinnerInline inverted /> :t('Create pad') }</button>
        </Form>);
    };

    const ActionAuthoredPad = ({ callbackDone }) => {
        const [padName, setPadName] = useState('');
        const [isLoading, setIsLoading] = useState(false);

        const createAuthoredPad = async () => {
            setIsLoading(true);
            const padId = await write.createPad(padName, 'public').catch((err) => {
                console.log(err);
            });
            if (!padId) {
                setIsLoading(false);

                return;
            }
            const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + padId;
            const roomId = await createWriteRoom(link, padName);
            router.push(`/write/${roomId}`);

            callbackDone && callbackDone();
            setPadName('');
            setIsLoading(false);
        };

        return (
            <Form onSubmit={(e) => { e.preventDefault(); createAuthoredPad(); }}>
                <input type="text" placeholder={t('pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
                <button type="submit" disabled={!padName}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Create pad') }</button>
            </Form>
        );
    };

    const submenuItems = _.filter([
        { value: 'existingPad', actionComponentToRender: ActionExistingPad, label: t('Add existing pad') },
        { value: 'anonymousPad', actionComponentToRender: ActionNewAnonymousPad, label: t('Create new anonymous pad') },
        getConfig().publicRuntimeConfig.authProviders.write.api && { value: 'authoredPad', actionComponentToRender: ActionAuthoredPad, label: t('Create new authored pad') },
        getConfig().publicRuntimeConfig.authProviders.write.api && { value: 'passwordPad', actionComponentToRender: ActionPasswordPad, label: t('Create password protected pad') },
    ]);

    // Add the user's Matrix displayname as parameter so that it shows up in Etherpad as username
    let iframeUrl;
    if (roomId && content && content.body) {
        iframeUrl = new URL(content.body);
        iframeUrl.searchParams.set('userName', auth.user.displayname);
    }

    return (
        <>
            <IframeLayout.Sidebar>
                { !serviceSpaceId ? (
                    <>
                        <h2>/write</h2>
                        <LoadingSpinner />
                    </>
                ) : (
                    <>
                        <ServiceSubmenu
                            title={<h2>/write</h2>}
                            subheadline={t('What would you like to do?')}
                            items={submenuItems} />
                        { getConfig().publicRuntimeConfig.authProviders.write.api && !serverPads && <ErrorMessage>{ t('Can\'t connect with the provided /write server. Please try again later.') }</ErrorMessage> }
                        <ServiceTable>
                            { matrix.spaces.get(serviceSpaceId).children?.map(writeRoomId => {
                                return <WriteListEntry
                                    key={writeRoomId}
                                    roomId={writeRoomId}
                                    selected={writeRoomId === roomId}
                                    serverPads={serverPads}
                                />;
                            }) }
                        </ServiceTable>
                    </>
                ) }
            </IframeLayout.Sidebar>
            { roomId && content && (
                <IframeLayout.IframeWrapper>
                    <IframeLayout.IframeHeader>
                        <h2>{ matrix.rooms.get(roomId).name }</h2>
                        <IframeLayout.IframeHeaderButtonWrapper>
                            <button title={t('Copy pad link to clipboard')} onClick={copyToClipboard}>
                                <Clipboard fill="var(--color-foreground)" />
                            </button>
                            <button title={t(mypadsPadObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deletePad}>
                                { isDeletingPad ? <LoadingSpinnerInline /> : <Bin fill="var(--color-foreground)" /> }
                            </button>
                        </IframeLayout.IframeHeaderButtonWrapper>
                    </IframeLayout.IframeHeader>
                    <iframe src={iframeUrl.toString()} />
                </IframeLayout.IframeWrapper>
            ) }
        </>
    );
}

Write.getLayout = () => {
    return IframeLayout.Layout;
};
