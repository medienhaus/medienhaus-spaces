import getConfig from 'next/config';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import styled from 'styled-components';
import _ from 'lodash';
import { useRouter } from 'next/router';
import Link from 'next/link';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import TextButton from '../../components/UI/TextButton';
import ErrorMessage from '../../components/UI/ErrorMessage';
import SketchList from './SketchList';
import FolderEditView from './FolderEditView';
import FrameView from '../../components/FrameView';
import CreateNewFolder from './CreateNewFolder';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
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

export default function Sketch() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrixSpaces = matrix.spaces.values();
    const { t } = useTranslation('sketch');
    const [folderEdit, setFolderEdit] = useState(false);
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');

    const application = 'sketch';
    const [errorMessage, setErrorMessage] = useState(false);
    const [serviceSpaceId, setServiceSpaceId] = useState();
    const [actionSelect, setActionSelect] = useState('');
    const [, setOpenActions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newSketchName, setNewSketchName] = useState('');
    const [sketchLink, setSketchLink] = useState('');
    const [validLink, setValidLink] = useState(false);
    const [serverSketches, setServerSketches] = useState({});
    const [content, setContent] = useState(matrix.roomContents.get(roomId));
    const [syncingServerSketches, setSyncingServerSketches] = useState(false);

    const sketch = auth.getAuthenticationProvider('sketch');

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
                    // @TODO check for meta information changes, i.e. name of sketch
                    if (matrixSketches[sketch.id]) {
                        // we check if the names of our sketches are still matching on the matrix server and on the sketch server
                        if (matrixSketches[sketch.id].name !== 'Link' && sketch.name !== matrixSketches[sketch.id].name) {
                            console.log('changing name');
                            console.log(matrixSketches[sketch.id]);
                            const namechange = await matrixClient.setRoomName(matrixSketches[sketch.id].id, sketch.name);
                            console.log(namechange);
                        }
                        continue;
                    }
                    // then we see if the entry is a folder and if so create the folder and underlying sketches first
                    if (sketch.type === 'folder') {
                        const space = await matrix.createRoom(sketch.name, true, '', 'invite', 'item');
                        await auth.getAuthenticationProvider('matrix').addSpaceChild(serviceSpaceId, space).catch(console.log);
                        const link = getConfig().publicRuntimeConfig.authProviders.sketch.baseUrl + 'folders/' + sketch.id;

                        await createSketchRoom(link, 'Link', space);
                        await updateStructure(sketch, space);
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
            const accountData = matrixClient.getAccountData('medienhaus');
            if (!accountData) {
                if (confirm(t('Do you want to sync /sketch with /spaces?'))) {
                    if (confirm(t('Remember choice?'))) matrixClient.setAccountData('medienhaus', { 'alwaysSyncServerSketches': true });
                    syncServerSketchesWithMatrix();
                }
            } else if (accountData.event.content.alwaysSyncServerSketches) {
                syncServerSketchesWithMatrix();
            }
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

    async function createSketchRoom(link = sketchLink, name = newSketchName, parent = serviceSpaceId) {
        console.debug('creating room for ' + name);
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
        // await write.syncAllPads();

        setActionSelect('');
        setNewSketchName('');
        setSketchLink('');
        // setPassword('');
        // setValidatePassword('');
        setOpenActions(false);
    }

    const handleExistingSketch = (e) => {
        setLoading(true);
        if (e.target.value.includes(getConfig().publicRuntimeConfig.authProviders.sketch.baseUrl)) setValidLink(true);
        else setValidLink(false);
        setSketchLink(e.target.value);
        setActionSelect('');
        setLoading(false);
    };

    const createNewSketchRoom = async () => {
        setLoading(true);
        const create = await sketch.createSpace(newSketchName);
        const link = getConfig().publicRuntimeConfig.authProviders.sketch.baseUrl + 'spaces/' + create._id;
        createSketchRoom(link);
        setActionSelect('');
        setLoading(false);
    };

    const renderSelectedOption = () => {
        switch (actionSelect) {
            case 'existingSketch':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); createSketchRoom(); }}>
                        <input type="text" placeholder={t('sketch name')} value={newSketchName} onChange={(e) => setNewSketchName(e.target.value)} />
                        <input type="text" placeholder={t('link to sketch')} value={sketchLink} onChange={handleExistingSketch} />
                        { !validLink && sketchLink !=='' && <span>{ t('Make sure your link includes') }:  { getConfig().publicRuntimeConfig.authProviders.sketch.baseUrl }</span> }

                        <button type="submit" disabled={!newSketchName}>{ loading ? <LoadingSpinner inverted /> : t('Add existing sketch') }</button>
                        { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
                    </form>);
            case 'newSketch':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); createNewSketchRoom(); }}>
                        <input type="text" placeholder={t('sketch name')} value={newSketchName} onChange={(e) => setNewSketchName(e.target.value)} />
                        <button type="submit" disabled={!newSketchName}>{ loading ? <LoadingSpinner inverted /> : t('Create sketch') }</button>
                        { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
                    </form>);
            default:
                return (null);
        }
    };

    if (!serviceSpaceId) return <LoadingSpinner />;

    return (
        <>
            <SidebarColumn>
                { roomId && <MultiColumnLayout.ColumnMobileHead><Link href="/write">/sketch</Link></MultiColumnLayout.ColumnMobileHead> }
                <>
                    <ServiceSubmenu title="/sketch">
                        <ServiceSubmenu.Toggle callback={() => setActionSelect('')} />
                        <ServiceSubmenu.List>
                            <ServiceSubmenu.Item><TextButton value="existingSketch" onClick={() => setActionSelect('existingSketch')}>{ t('Add existing sketch') }</TextButton></ServiceSubmenu.Item>
                            <ServiceSubmenu.Item><TextButton value="newSketch" onClick={() => setActionSelect('newSketch')}>{ t('Create sketch') }</TextButton></ServiceSubmenu.Item>
                        </ServiceSubmenu.List>
                    </ServiceSubmenu>
                    { renderSelectedOption() }
                </>
                { folderEdit ? <FolderEditView
                    spaceId={serviceSpaceId}
                    setFolderEdit={setFolderEdit}
                    folderEdit={folderEdit}
                /> :syncingServerSketches ? <span><LoadingSpinner />{ t('Syncing pads from sketch server') } </span> :
                    <>
                        <ul>
                            {
                                matrix.spaces && <SketchList
                                    id={serviceSpaceId}
                                    setFolderEdit={setFolderEdit}
                                    folderEdit={folderEdit}

                                />
                            }
                        </ul>
                        <CreateNewFolder serviceSpaceId={serviceSpaceId} />
                    </>
                }
            </SidebarColumn>
            { roomId && content && (
                <IframeColumn>
                    <FrameView link={content.body} />
                </IframeColumn>
            ) }
        </>
    );
}

