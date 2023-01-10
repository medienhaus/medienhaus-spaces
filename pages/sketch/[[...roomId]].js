import getConfig from 'next/config';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import _ from 'lodash';
import { useRouter } from 'next/router';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ErrorMessage from '../../components/UI/ErrorMessage';
import Bin from '../../assets/icons/bin.svg';
import Clipboard from '../../assets/icons/clipboard.svg';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import IframeLayout from '../../components/layouts/iframe';
import SketchLinkEntry from './SketchLinkEntry';
import { ServiceTable } from '../../components/UI/ServiceTable';

export default function Sketch() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrixSpaces = matrix.spaces.values();
    const { t } = useTranslation('sketch');
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');

    const application = 'sketch';
    const [errorMessage, setErrorMessage] = useState(false);
    const [serviceSpaceId, setServiceSpaceId] = useState();
    const [loading, setLoading] = useState(false);
    const [removingLink, setRemovingLink] = useState(false);
    const [serverSketches, setServerSketches] = useState({});
    const [content, setContent] = useState(matrix.roomContents.get(roomId));
    const [syncingServerSketches, setSyncingServerSketches] = useState(false);

    const sketch = auth.getAuthenticationProvider('sketch');

    const lookForApplicationsFolder = async () => {
        const findApplicationsFolder = Array.from(matrixSpaces).find(space => space.meta?.template === 'applications');
        if (findApplicationsFolder) {
            // eslint-disable-next-line no-undef
            if (process.env.NODE_ENV === 'development') console.info('found applications space');
            return findApplicationsFolder.roomId;
        } else {
            // eslint-disable-next-line no-undef
            if (process.env.NODE_ENV === 'development') console.log('creating root applications folder');
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

    const lookForServiceFolder = async (applicationsSpaceId) => {
        const findServiceSpace = Array.from(matrix.spaces.values()).find(space => space.name === application);
        if (findServiceSpace) return findServiceSpace.roomId;
        else {
            // eslint-disable-next-line no-undef
            if (process.env.NODE_ENV === 'development') console.info('creating service space');
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

    useEffect(() => {
        let cancelled = false;
        const startLookingForFolders = async () => {
            if (matrix.initialSyncDone) {
                try {
                    const applicationsSpaceId = await lookForApplicationsFolder();
                    const space = await lookForServiceFolder(applicationsSpaceId);
                    setServiceSpaceId(space);
                } catch (err) {
                    // eslint-disable-next-line no-undef
                    if (process.env.NODE_ENV === 'development') console.debug(err);
                }
            }
        };
        !cancelled && startLookingForFolders();
        return () => cancelled = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matrix.initialSyncDone]);

    useEffect(() => {
        let cancelled = false;

        const syncServerSketchesWithMatrix = async () => {
            setSyncingServerSketches(true);
            // since sketches can be created in spacedeck as well as within /spaces, we need to keep them up do date.
            let matrixSketches = {};
            const getAllMatrixSketches = (id, parent) => {
                // first we check if a room for the sketch on the server already exists in matrix.
                if (matrix?.spaces.get(id)?.children) {
                    // if there are rooms within the space id we grab the names of those rooms
                    for (const roomId of matrix.spaces.get(id).children) {
                        // in order to get the actual spacedeck id of the sketch we need to check the room content
                        const id = matrix.roomContents.get(roomId)?.body.substring(matrix.roomContents.get(roomId).body.lastIndexOf('/') + 1);
                        if (!id) {
                            // if no content was found we can assume we are handleing a space and also want to loop through any rooms within it
                            getAllMatrixSketches(roomId);
                            continue;
                        }
                        //@ TODO recursion if space/folder
                        // and then we add it to our object
                        matrixSketches = Object.assign({}, matrixSketches, {
                            [id]: {
                                name: matrix.rooms.get(roomId).name,
                                id: roomId,
                            },
                        });
                    }
                }
            };
            getAllMatrixSketches(serviceSpaceId);

            const updateStructure = async (object, parent) => {
                for (const sketch of Object.values(object)) {
                    // if the element does not have an id key, we can safely assume it is a key of a folder from recursion and skip it.
                    if (!sketch.id) continue;
                    // now we can check if a sketch already exists in matrix and if so we can skip this sketch.
                    if (matrixSketches[sketch.id]) {
                        // we check if the names of our sketches are still matching on the matrix server and on the sketch server
                        if (sketch.name !== matrixSketches[sketch.id].name) {
                            // eslint-disable-next-line no-undef
                            if (process.env.NODE_ENV === 'development') console.log('changing name for ' + matrixSketches[sketch.id]);
                            await matrixClient.setRoomName(matrixSketches[sketch.id].id, sketch.name);
                        }
                        continue;
                    }
                    // then we check if the entry is a folder and if so cycle through the folder and underlying sketches first
                    if (sketch.type === 'folder') {
                        await updateStructure(sketch, parent);
                        continue;
                    }
                    // otherwise we create a room for the sketch
                    const link = getConfig().publicRuntimeConfig.authProviders.sketch.baseUrl + 'spaces/' + sketch.id;
                    await createSketchRoom(link, sketch.name, parent);
                }
            };
            await sketch.syncAllSketches();
            await updateStructure(sketch.getStructure());
            setSyncingServerSketches(false);
        };

        if (!cancelled && serviceSpaceId && serverSketches) {
            syncServerSketchesWithMatrix();
        }

        return () => cancelled = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceSpaceId, serverSketches]);

    useEffect(() => {
        let cancelled = false;
        const populatePadsfromServer = async () => {
            if (!isEmpty(sketch.getStructure())) {
                setServerSketches(sketch.getStructure());
            } else {
                await sketch.syncAllSketches();
                populatePadsfromServer();
            }
        };
        !cancelled && getConfig().publicRuntimeConfig.authProviders.write.api && populatePadsfromServer();

        return () => {
            cancelled = true;
        };
    }, [sketch]);

    useEffect(() => {
        let cancelled = false;

        !cancelled && setContent(matrix.roomContents.get(roomId));

        return () => cancelled = true;
    }, [matrix.roomContents, roomId]);

    async function createSketchRoom(link, name, parent = serviceSpaceId) {
        // eslint-disable-next-line no-undef
        if (process.env.NODE_ENV === 'development') console.debug('creating room for ' + name);
        const room = await matrix.createRoom(name, false, '', 'invite', 'content', 'link').catch(() => {
            setErrorMessage(t('Something went wrong when trying to create a new room'));
        });
        await auth.getAuthenticationProvider('matrix').addSpaceChild(parent, room).catch(() => {
            setErrorMessage(t('Couldn\'t add the new room to your sketch folder'));
        });
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: link,
        }).catch(() => {
            setErrorMessage(t('Something went wrong when trying to save the new sketch link'));
        });
    }

    const copyToClipboard = () => navigator.clipboard.writeText(content.body);

    const removeLink = async () => {
        // @TODO callback function to give user feedback when removing on the server fails
        setRemovingLink(true);
        const remove = await sketch.deleteSpaceById(content.substring(content.lastIndexOf('/') + 1)).catch(() => {});
        if (!remove) {
            setRemovingLink(false);
            return;
        }
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(parent, roomId);
        await matrix.leaveRoom(roomId);
        setRemovingLink(false);
    };

    const ActionNewSketch = () => {
        const [sketchName, setSketchName] = useState('');

        const createNewSketchRoom = async () => {
            setLoading(true);
            const create = await sketch.createSpace(sketchName);
            const link = getConfig().publicRuntimeConfig.authProviders.sketch.baseUrl + 'spaces/' + create._id;
            createSketchRoom(link);
            setLoading(false);
        };

        return (
            <form onSubmit={(e) => { e.preventDefault(); createNewSketchRoom(); }}>
                <input type="text" placeholder={t('sketch name')} value={sketchName} onChange={(e) => setSketchName(e.target.value)} />
                <button type="submit" disabled={!sketchName}>{ loading ? <LoadingSpinner inverted /> : t('Create sketch') }</button>
                { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
            </form>);
    };

    const ActionExistingSketch = () => {
        const [sketchName, setSketchName] = useState('');
        const [sketchLink, setSketchLink] = useState('');
        const [validLink, setValidLink] = useState(false);

        const handleExistingSketch = (e) => {
            setLoading(true);
            if (e.target.value.includes(getConfig().publicRuntimeConfig.authProviders.sketch.baseUrl)) setValidLink(true);
            else setValidLink(false);
            setSketchLink(e.target.value);
            setLoading(false);
        };

        return (
            <form onSubmit={(e) => { e.preventDefault(); createSketchRoom(sketchLink, sketchName); }}>
                <input type="text" placeholder={t('sketch name')} value={sketchName} onChange={(e) => setSketchName(e.target.value)} />
                <input type="text" placeholder={t('link to sketch')} value={sketchLink} onChange={handleExistingSketch} />
                { !validLink && sketchLink !=='' && <span>{ t('Make sure your link includes') }:  { getConfig().publicRuntimeConfig.authProviders.sketch.baseUrl }</span> }

                <button type="submit" disabled={!sketchName}>{ loading ? <LoadingSpinner inverted /> : t('Add existing sketch') }</button>
                { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
            </form>);
    };

    if (!serviceSpaceId) return <LoadingSpinner />;

    return (
        <>
            <IframeLayout.Sidebar>
                <ServiceSubmenu title={<h2>/sketch</h2>}>
                    <ServiceSubmenu.Menu subheadline={t('What do you want to do?')}>
                        <ServiceSubmenu.Item actionComponentToRender={<ActionExistingSketch />}>{ t('Add existing sketch') }</ServiceSubmenu.Item>
                        <ServiceSubmenu.Item actionComponentToRender={<ActionNewSketch />}>{ t('Create sketch') }</ServiceSubmenu.Item>
                    </ServiceSubmenu.Menu>
                </ServiceSubmenu>
                { syncingServerSketches ?
                    <span><LoadingSpinner />{ t('Syncing pads from sketch server') } </span> :
                    <ServiceTable>
                        <ul>{ matrix.spaces.get(serviceSpaceId).children?.map(roomId => {
                            return <SketchLinkEntry roomId={roomId} key={roomId} parent={serviceSpaceId} />;
                        }) }
                        </ul>
                    </ServiceTable>
                }
            </IframeLayout.Sidebar>
            { roomId && content && (
                <IframeLayout.IframeWrapper>
                    <IframeLayout.IframeHeader>
                        <h2>{ matrix.rooms.get(roomId).name }</h2>
                        <IframeLayout.IframeHeaderButtonWrapper>
                            <button title={t('Copy pad link to clipboard')} onClick={copyToClipboard}>
                                <Clipboard fill="var(--color-foreground)" />
                            </button>
                            <button title={t('Remove pad from my library')} onClick={removeLink}>
                                { removingLink ? <LoadingSpinner /> : <Bin fill="var(--color-foreground)" /> }
                            </button>
                        </IframeLayout.IframeHeaderButtonWrapper>
                    </IframeLayout.IframeHeader>
                    <iframe src={content.body} />
                </IframeLayout.IframeWrapper>
            ) }
        </>
    );
}

Sketch.getLayout = () => {
    return IframeLayout.Layout;
};
