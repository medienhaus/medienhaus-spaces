import getConfig from 'next/config';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import _ from 'lodash';
import { useRouter } from 'next/router';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ErrorMessage from '../../components/UI/ErrorMessage';
import Bin from '../../assets/icons/bin.svg';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import IframeLayout from '../../components/layouts/iframe';
import { ServiceTable } from '../../components/UI/ServiceTable';
import Form from '../../components/UI/Form';
import AddBookmark from '../../components/UI/AddBookmark';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import ServiceLink from '../../components/UI/ServiceLink';

export default function Spacedeck() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation('spacedeck');
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');

    const [errorMessage, setErrorMessage] = useState(false);
    const [serviceSpaceId, setServiceSpaceId] = useState();
    const [removingLink, setRemovingLink] = useState(false);
    const [serverSketches, setServerSketches] = useState({});
    const [content, setContent] = useState(matrix.roomContents.get(roomId));
    const [syncingServerSketches, setSyncingServerSketches] = useState(false);
    const [isSpacedeckServerDown, setIsSpacedeckServerDown] = useState(false);
    const path = getConfig().publicRuntimeConfig.authProviders.spacedeck.path?.replace(/[<>\s/:]/g, '') || 'spacedeck';

    const spacedeck = auth.getAuthenticationProvider('spacedeck');

    // Whenever the roomId changes (e.g. after a new sketch was created), automatically focus that element.
    // This makes the sidebar scroll to the element if it is outside of the current viewport.
    const selectedPadRef = useRef(null);
    useEffect(() => {
        selectedPadRef.current?.focus();
    }, [roomId]);

    useEffect(() => {
        let cancelled = false;

        const startLookingForFolders = async () => {
            if (matrix.initialSyncDone) {
                try {
                    setServiceSpaceId(matrix.serviceSpaces.spacedeck);
                } catch (err) {
                    console.log(err);
                }
            }
        };

        !cancelled && startLookingForFolders();

        return () => cancelled = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matrix.initialSyncDone, matrix.serviceSpaces.spacedeck]);

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
                    const link = getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl + '/spaces/' + sketch.id;
                    await createSketchRoom(link, sketch.name, parent);
                }
            };
            const syncSketches = await spacedeck.syncAllSketches()
                .catch((error) => {
                    console.debug(error);
                    setIsSpacedeckServerDown(true);
                });
            syncSketches && await updateStructure(spacedeck.getStructure());
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
        const populateSketchesfromServer = async (recursion) => {
            if (!isEmpty(spacedeck.getStructure())) {
                setServerSketches(spacedeck.getStructure());
            } else if (!recursion) {
                await spacedeck.syncAllSketches();
                populateSketchesfromServer(true);
            }
        };
        !cancelled && getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl && populateSketchesfromServer();

        return () => {
            cancelled = true;
        };
    }, [spacedeck]);

    useEffect(() => {
        let cancelled = false;

        !cancelled && setContent(matrix.roomContents.get(roomId));

        return () => cancelled = true;
    }, [matrix.roomContents, roomId]);

    async function createSketchRoom(link, name, parent = serviceSpaceId) {
        // eslint-disable-next-line no-undef
        if (process.env.NODE_ENV === 'development') console.debug('creating room for ' + name);
        const room = await matrix.createRoom(name, false, '', 'invite', 'content', 'sketch-link').catch(() => {
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

        return room;
    }

    const removeLink = async () => {
        setRemovingLink(true);
        const remove = await spacedeck.deleteSpaceById(content.body.substring(content.body.lastIndexOf('/') + 1)).catch((e) => console.log(e));
        if (!remove || remove.ok) {
            setRemovingLink(false);
            alert(t('Something went wrong when trying to delete the sketch, please try again or if the error persists, try logging out and logging in again.'));

            return;
        }
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(serviceSpaceId, roomId);
        await matrix.leaveRoom(roomId);
        router.push(`/${path}`);
        setRemovingLink(false);
    };

    const ActionNewSketch = ({ callbackDone }) => {
        const [sketchName, setSketchName] = useState('');
        const [loading, setLoading] = useState(false);

        const createNewSketchRoom = async () => {
            setLoading(true);

            const create = await spacedeck.createSpace(sketchName);
            const link = getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl + '/spaces/' + create._id;
            const roomId = await createSketchRoom(link, sketchName);
            router.push(`/${path}/${roomId}`);

            callbackDone && callbackDone();
            setLoading(false);
        };

        return (
            <Form onSubmit={(e) => { e.preventDefault(); createNewSketchRoom(); }}>
                <input type="text" placeholder={t('sketch name')} value={sketchName} onChange={(e) => setSketchName(e.target.value)} />
                <button type="submit" disabled={!sketchName || loading}>{ loading ? <LoadingSpinnerInline inverted /> : t('Create sketch') }</button>
                { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
            </Form>);
    };

    const ActionExistingSketch = ({ callbackDone }) => {
        const [sketchName, setSketchName] = useState('');
        const [sketchLink, setSketchLink] = useState('');
        const [validLink, setValidLink] = useState(false);
        const [loading, setLoading] = useState(false);

        const handleExistingSketch = (e) => {
            setLoading(true);
            if (getConfig().publicRuntimeConfig.authProviders.sketch.bypassUrlValidation) {
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
                // we check if the link is valid for the service (has the same base url)
                if (e.target.value.includes(getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl)) setValidLink(true);
                else setValidLink(false);
            }
            setSketchLink(e.target.value);
        };

        const handleSubmit = async (e) => {
            setLoading(true);
            e.preventDefault();
            const roomId = await createSketchRoom(sketchLink, sketchName);
            router.push(`/${getConfig().publicRuntimeConfig.authProviders.spacedeck.path}/${roomId}`);
            setSketchLink('');
            callbackDone && callbackDone();
            setLoading(false);
        };

        return (
            <Form onSubmit={handleSubmit}>
                <input type="text" placeholder={t('sketch name')} value={sketchName} onChange={(e) => setSketchName(e.target.value)} />
                <input type="text" placeholder={t('link to sketch')} value={sketchLink} onChange={handleExistingSketch} />
                { !validLink && sketchLink !== '' && <ErrorMessage>{ t('Make sure your link includes "{{url}}"', { url: getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl }) }</ErrorMessage> }

                <button type="submit" disabled={!sketchName || !validLink || loading}>{ loading ? <LoadingSpinnerInline inverted /> : t('Add existing sketch') }</button>
                { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
            </Form>);
    };

    if (!serviceSpaceId) return <LoadingSpinner />;

    return (
        <>
            <IframeLayout.Sidebar>
                <ServiceSubmenu
                    title={<h2>{ getConfig().publicRuntimeConfig.authProviders.spacedeck.path }</h2>}
                    subheadline={t('What would you like to do?')}
                    items={[
                        { value: 'existingSketch', actionComponentToRender: ActionExistingSketch, label: t('Add existing sketch') },
                        { value: 'newSketch', actionComponentToRender: ActionNewSketch, label: t('Create sketch') },
                    ]}
                />
                { syncingServerSketches ?
                    <LoadingSpinner /> :
                    <>
                        <ServiceTable>
                            { matrix.spaces.get(serviceSpaceId).children?.map(spacedeckRoomId => {
                                return <ServiceLink
                                    roomId={spacedeckRoomId}
                                    name={matrix.rooms.get(spacedeckRoomId).name}
                                    path={path}
                                    selected={roomId === spacedeckRoomId}
                                    key={spacedeckRoomId}
                                    ref={spacedeckRoomId === roomId ? selectedPadRef : null}
                                />;
                            }) }
                        </ServiceTable>
                        { isSpacedeckServerDown && <ErrorMessage>{ t('Can\'t connect with the provided /sketch server. Please try again later.') }</ErrorMessage> }
                    </>

                }
            </IframeLayout.Sidebar>
            { roomId && content && (
                <IframeLayout.IframeWrapper>
                    <IframeLayout.IframeHeader>
                        <h2>{ matrix.rooms.get(roomId).name }</h2>
                        <IframeLayout.IframeHeaderButtonWrapper>
                            <CopyToClipboard title={t('Copy sketch link to clipboard')} content={content.body} />
                            <AddBookmark name={matrix.rooms.get(roomId).name} />
                            <button title={t('Delete sketch from my library')} onClick={removeLink}>
                                { removingLink ? <LoadingSpinnerInline /> : <Bin fill="var(--color-foreground)" /> }
                            </button>
                        </IframeLayout.IframeHeaderButtonWrapper>
                    </IframeLayout.IframeHeader>
                    <iframe src={content.body} />
                </IframeLayout.IframeWrapper>
            ) }
        </>
    );
}

Spacedeck.getLayout = () => {
    return IframeLayout.Layout;
};
