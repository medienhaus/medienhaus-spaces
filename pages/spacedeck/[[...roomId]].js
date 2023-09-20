import getConfig from 'next/config';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { logger } from 'matrix-js-sdk/lib/logger';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ErrorMessage from '../../components/UI/ErrorMessage';
import Bin from '../../assets/icons/bin.svg';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import IframeLayout from '../../components/layouts/iframe';
import { ServiceTable } from '../../components/UI/ServiceTable';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import ServiceLink from '../../components/UI/ServiceLink';
import CreateNewSketch from './actions/CreateNewSketch';
import AddExistingSketch from './actions/AddExistingSketch';
import { path as spacedeckPath } from '../../lib/Spacedeck';

export default function Spacedeck() {
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation('spacedeck');
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');
    const [errorMessage, setErrorMessage] = useState(false);
    const serviceSpaceId = matrix.serviceSpaces.spacedeck;
    const [isDeletingSketch, setIsDeletingSketch] = useState(false);
    const [serverSketches, setServerSketches] = useState({});
    const content = matrix.roomContents.get(roomId);
    const [syncingServerSketches, setSyncingServerSketches] = useState(false);
    const [isSpacedeckServerDown, setIsSpacedeckServerDown] = useState(false);

    const spacedeck = auth.getAuthenticationProvider('spacedeck');

    // Whenever the roomId changes (e.g. after a new sketch was created), automatically focus that element.
    // This makes the sidebar scroll to the element if it is outside of the current viewport.
    const selectedSketchRef = useRef(null);
    useEffect(() => {
        selectedSketchRef.current?.focus();
    }, [roomId]);

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
                            logger.debug('changing name for ' + matrixSketches[sketch.id]);
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
            const syncSketches = await spacedeck.syncAllSpaces()
                .catch((error) => {
                    logger.debug(error);
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
                await spacedeck.syncAllSpaces();
                populateSketchesfromServer(true);
            }
        };
        !cancelled && getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl && populateSketchesfromServer();

        return () => {
            cancelled = true;
        };
    }, [spacedeck]);

    async function createSketchRoom(link, name, parent = serviceSpaceId) {
        // eslint-disable-next-line no-undef
        logger.debug('creating room for ' + name);
        const room = await matrix.createRoom(name, false, '', 'invite', 'content', 'spacedeck').catch(() => {
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

    const removeSketch = async () => {
        setIsDeletingSketch(true);
        const remove = await spacedeck.deleteSpaceById(content.body.substring(content.body.lastIndexOf('/') + 1)).catch((e) => logger.debug(e));
        if (!remove || remove.ok) {
            setIsDeletingSketch(false);
            alert(t('Something went wrong when trying to delete the sketch, please try again or if the error persists, try logging out and logging in again.'));

            return;
        }
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(serviceSpaceId, roomId);
        await matrix.leaveRoom(roomId);
        router.push(`${spacedeckPath}`);
        setIsDeletingSketch(false);
    };

    if (!serviceSpaceId) return <LoadingSpinner />;

    return (
        <>
            <IframeLayout.Sidebar>
                <ServiceSubmenu
                    title={<h2>{ spacedeckPath }</h2>}
                    subheadline={t('What would you like to do?')}
                    items={[
                        { value: 'existingSketch', actionComponentToRender: <AddExistingSketch createSketchRoom={createSketchRoom} errorMessage={errorMessage} />, label: t('Add existing sketch') },
                        { value: 'newSketch', actionComponentToRender: <CreateNewSketch createSketchRoom={createSketchRoom} errorMessage={errorMessage} />, label: t('Create new sketch') },
                    ]}
                />
                { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
                { syncingServerSketches ?
                    <LoadingSpinner /> :
                    <>
                        <ServiceTable>
                            { matrix.spaces.get(serviceSpaceId).children?.map(spacedeckRoomId => {
                                return <ServiceLink
                                    key={spacedeckRoomId}
                                    name={matrix.rooms.get(spacedeckRoomId).name}
                                    href={`${spacedeckPath}/${spacedeckRoomId}`}
                                    selected={roomId === spacedeckRoomId}
                                    ref={spacedeckRoomId === roomId ? selectedSketchRef : null}
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
                            <button title={t('Delete sketch')} onClick={removeSketch}>
                                { isDeletingSketch ? <LoadingSpinnerInline /> : <Bin fill="var(--color-foreground)" /> }
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
