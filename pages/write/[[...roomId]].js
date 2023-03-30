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
import { ServiceTable } from '../../components/UI/ServiceTable';
import Form from '../../components/UI/Form';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import WriteIframeHeader from './WriteIframeHeader';

export default function Write() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation('write');
    const router = useRouter();
    // A roomId is set when the route is /write/<roomId>, otherwise it's undefined
    const roomId = _.get(router, 'query.roomId.0');
    const [serviceSpaceId, setServiceSpaceId] = useState();
    const [serverPads, setServerPads] = useState({});
    const [removingLink, setRemovingLink] = useState(false);
    const [content, setContent] = useState(matrix.roomContents.get(roomId));
    const [closeSubemnuToggle, setCloseSubemnuToggle] = useState(false);

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
        // if we add matrix[key] to the dependency array we end up creating infinite loops in the event of someone creating pads within mypads that are then synced here.
        // therefore we need to disable the linter for the next line
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceSpaceId, serverPads, createWriteRoom]);

    const copyToClipboard = () => navigator.clipboard.writeText(content.body);

    const removeLink = async () => {
        setRemovingLink(true);
        const padExistsOnServer = serverPads[content.body.substring(content.body.lastIndexOf('/') + 1)];
        padExistsOnServer && await write.deletePadById(padExistsOnServer._id);
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(serviceSpaceId, roomId);
        await matrix.leaveRoom(roomId);
        await syncServerPadsAndSet();
        router.push('/write');
        setRemovingLink(false);
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

    const ActionNewAnonymousPad = () => {
        const [padName, setPadName] = useState('');
        const [loading, setLoading] = useState(false);

        const createAnonymousPad = async () => {
            setLoading(true);
            let string = '';
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
            const charactersLength = characters.length;
            for (let i = 0; i < 20; i++) {
                string += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + string;
            const roomId = await createWriteRoom(link, padName);
            router.push(`/write/${roomId}`);

            setLoading(false);
            setPadName('');
            // in order to close the service sub menu we need to set the toggle to true and reset it to false so it works again the next time around
            setCloseSubemnuToggle(true);
            setCloseSubemnuToggle(false);
        };

        return (
            <Form onSubmit={(e) => { e.preventDefault(); createAnonymousPad(padName); }}>
                <input type="text" placeholder={t('pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
                <button type="submit" disabled={!padName}>{ loading ? <LoadingSpinnerInline inverted /> : t('Create pad') }</button>
            </Form>);
    };

    const ActionExistingPad = () => {
        const [padName, setPadName] = useState('');
        const [padLink, setPadLink] = useState('');
        const [validLink, setValidLink] = useState('undefined');
        const [loading, setLoading] = useState(false);

        const handleExistingPad = (e) => {
            if (getConfig().publicRuntimeConfig.authProviders.write.bypassUrlValidation) {
                const isValidUrl = urlString => {
                    let url;
                    try {
                        url = new URL(urlString);
                    } catch (e) {
                        return false;
                    }
                    return url.protocol === 'http:' || url.protocol === 'https:';
                };
                if (isValidUrl(e.target.value)) setValidLink(true);
                else setValidLink(false);
            } else {
                if (e.target.value.includes(getConfig().publicRuntimeConfig.authProviders.write.baseUrl)) setValidLink(true);
                else setValidLink(false);
            }
            setPadLink(e.target.value);
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            const roomId = await createWriteRoom(padLink, padName);
            router.push(`/write/${roomId}`);
            // in order to close the service sub menu we need to set the toggle to true and reset it to false so it works again the next time around
            setCloseSubemnuToggle(true);
            setCloseSubemnuToggle(false);
            setPadLink('');
            setLoading(false);
        };

        return (
            <Form onSubmit={handleSubmit}>
                <input type="text" placeholder={t('pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
                <input type="text" placeholder={t('link to pad')} value={padLink} onChange={handleExistingPad} />
                { !validLink && <ErrorMessage>
                    { t(getConfig().publicRuntimeConfig.authProviders.write.bypassUrlValidation ?
                        'Not a valid link'
                        : 'Make sure your link includes "{{url}}"', { url: getConfig().publicRuntimeConfig.authProviders.write.baseUrl }) }
                </ErrorMessage> }
                <button type="submit" disabled={!padName || !padLink || !validLink}>{ loading ? <LoadingSpinnerInline inverted /> : t('Add existing pad') }</button>
            </Form>);
    };

    const ActionPasswordPad = () => {
        const [padName, setPadName] = useState('');
        const [password, setPassword] = useState('');
        const [validatePassword, setValidatePassword] = useState('');
        const [loading, setLoading] = useState(false);

        const createPasswordPad = async () => {
            setLoading(true);
            const padId = await write.createPad(padName, 'private', password);
            const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + padId;
            const roomId = await createWriteRoom(link, padName);
            router.push(`/write/${roomId}`);
            // in order to close the service sub menu we need to set the toggle to true and reset it to false so it works again the next time around
            setCloseSubemnuToggle(true);
            setCloseSubemnuToggle(false);
            setPadName('');
            setLoading(false);
        };

        return (<Form onSubmit={(e) => { e.preventDefault(); createPasswordPad(); }}>
            <input type="text" placeholder={t('pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
            <input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="password" placeholder={t('confirm password')} value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
            <button type="submit" disabled={!padName || !password || password !== validatePassword}>{ loading ? <LoadingSpinnerInline inverted /> :t('Create pad') }</button>
        </Form>);
    };

    const ActionAuthoredPad = () => {
        const [padName, setPadName] = useState('');
        const [loading, setLoading] = useState(false);

        const createAuthoredPad = async () => {
            setLoading(true);
            const padId = await write.createPad(padName, 'public').catch((err) => {
                console.log(err);
            });
            if (!padId) {
                setLoading(false);
                return;
            }
            const link = getConfig().publicRuntimeConfig.authProviders.write.baseUrl + '/' + padId;
            const roomId = await createWriteRoom(link, padName);
            router.push(`/write/${roomId}`);
            // in order to close the service sub menu we need to set the toggle to true and reset it to false so it works again the next time around
            setCloseSubemnuToggle(true);
            setCloseSubemnuToggle(false);
            setPadName('');
            setLoading(false);
        };

        return (
            <Form onSubmit={(e) => { e.preventDefault(); createAuthoredPad(); }}>
                <input type="text" placeholder={t('pad name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
                <button type="submit" disabled={!padName}>{ loading ? <LoadingSpinnerInline inverted /> : t('Create pad') }</button>
            </Form>);
    };

    <ServiceSubmenu.Item actionComponentToRender={ActionNewAnonymousPad}>{ t('Create new anonymous pad') }</ServiceSubmenu.Item>;

    if (!serviceSpaceId) return <LoadingSpinner />;

    return (
        <>
            <IframeLayout.Sidebar>
                <>
                    <ServiceSubmenu title={<h2>/write</h2>} closeToggle={closeSubemnuToggle}>
                        <ServiceSubmenu.Menu subheadline={t('What do you want to do?')}>
                            <ServiceSubmenu.Item disabled itemValue="">-- { t('select action') } --</ServiceSubmenu.Item>
                            <ServiceSubmenu.Item itemValue="existingPad" actionComponentToRender={<ActionExistingPad />}>{ t('Add existing pad') }</ServiceSubmenu.Item>
                            <ServiceSubmenu.Item itemValue="anonymousPad" actionComponentToRender={<ActionNewAnonymousPad />}>{ t('Create new anonymous pad') }</ServiceSubmenu.Item>
                            { getConfig().publicRuntimeConfig.authProviders.write.api && <ServiceSubmenu.Item actionComponentToRender={<ActionAuthoredPad />}>{ t('Create new authored pad') }</ServiceSubmenu.Item> }
                            { getConfig().publicRuntimeConfig.authProviders.write.api && <ServiceSubmenu.Item actionComponentToRender={<ActionPasswordPad />}>{ t('Create password protected pad') }</ServiceSubmenu.Item> }
                        </ServiceSubmenu.Menu>
                    </ServiceSubmenu>
                    { getConfig().publicRuntimeConfig.authProviders.write.api && !serverPads && <ErrorMessage>{ t('Can\'t connect with the provided /write server. Please try again later.') }</ErrorMessage> }
                    <ServiceTable>
                        { matrix.spaces.get(serviceSpaceId).children?.map(writeRoomId => {
                            return <WriteListEntry
                                key={writeRoomId}
                                roomId={writeRoomId}
                                selected={writeRoomId === roomId}
                                parent={serviceSpaceId}
                                serverPads={serverPads}
                                removeLink={removeLink}
                                copyToClipboard={copyToClipboard}
                            />;
                        }) }
                    </ServiceTable>
                </>
            </IframeLayout.Sidebar>
            { roomId && content && (
                <IframeLayout.IframeWrapper>
                    <WriteIframeHeader
                        content={content.body}
                        title={matrix.rooms.get(roomId).name}
                        removeLink={removeLink}
                        removingLink={removingLink} />
                    <iframe src={content.body} />

                </IframeLayout.IframeWrapper>
            ) }
        </>
    );
}

Write.getLayout = () => {
    return IframeLayout.Layout;
};
