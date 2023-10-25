import getConfig from 'next/config';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { logger } from 'matrix-js-sdk/lib/logger';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ErrorMessage from '../../components/UI/ErrorMessage';
import TextButton from '../../components/UI/TextButton';
import Bin from '../../assets/icons/bin.svg';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import IframeLayout from '../../components/layouts/iframe';
import { ServiceTable } from '../../components/UI/ServiceTable';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import ServiceLink from '../../components/UI/ServiceLink';
import CreateNewSketch from './actions/CreateNewSketch';
import AddExistingSketch from './actions/AddExistingSketch';
import { path as spacedeckPath } from '../../lib/Spacedeck';
import InviteUserToMatrixRoom from '../../components/UI/InviteUsersToMatrixRoom';
import { getOrdinalSuffix } from '../../lib/Utils';
import useConfirm from '../../components/UI/useLoginPrompt';
import useServerStatus from '../../components/useServerStatus';

export default function Spacedeck() {
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation('spacedeck');
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');
    const [errorMessage, setErrorMessage] = useState(false);
    const serviceSpaceId = matrix.serviceSpaces.spacedeck;
    const spacedeckChildren = matrix.spaces.get(serviceSpaceId)?.children?.filter(child => child !== 'undefined'); // Filter out any undefined values to ensure 'spacedeckChildren' only contains valid objects
    const [isDeletingSketch, setIsDeletingSketch] = useState(false);
    const [serverSketches, setServerSketches] = useState({});
    const content = matrix.roomContents.get(roomId);
    const [syncingServerSketches, setSyncingServerSketches] = useState(false);
    // const { confirm, isConfirmVisible, ConfirmDialog } = useConfirm();

    const { loginPrompt, Confirmation, password } = useConfirm();

    const spacedeck = auth.getAuthenticationProvider('spacedeck');
    const [isSpacedeckServerOnline, checkServerStatus] = useServerStatus(spacedeck.url);

    // Whenever the roomId changes (e.g. after a new sketch was created), automatically focus that element.
    // This makes the sidebar scroll to the element if it is outside the current viewport.
    const selectedSketchRef = useRef(null);
    useEffect(() => {
        selectedSketchRef.current?.focus();
    }, [roomId]);

    useEffect(() => {
        let cancelled = false;

        const matrixSketches = {};

        // Function to recursively collect all Matrix sketches within a space
        const getAllMatrixSketches = (id, parent) => {
            if (matrix?.spaces.get(id)?.children) {
                for (const roomId of spacedeckChildren) {
                    // Extract the spacedeck id from room content
                    const roomIdContent = matrix.roomContents.get(roomId);
                    const id = roomIdContent?.body.substring(roomIdContent.body.lastIndexOf('/') + 1);
                    if (!id) {
                        // If no content was found, it's likely a space with nested rooms, so continue searching
                        getAllMatrixSketches(roomId);
                        continue;
                    }
                    // Add the sketch information to matrixSketches object
                    matrixSketches[id] = {
                        name: matrix.rooms.get(roomId).name,
                        id: roomId,
                    };
                }
            }
        };

        // Function to update the Matrix rooms based on spacedeck sketches
        const updateStructure = async (object, parent) => {
            for (const sketch of Object.values(object)) {
                if (!sketch.id) continue;
                if (matrixSketches[sketch.id]) {
                    if (sketch.name !== matrixSketches[sketch.id].name) {
                        // If the sketch names differ, update the Matrix room name
                        logger.debug('changing name for ' + matrixSketches[sketch.id]);
                        await matrixClient.setRoomName(matrixSketches[sketch.id].id, sketch.name);
                    }
                    continue;
                }

                if (sketch.type === 'folder') {
                    // Recursively update the structure for nested folders
                    await updateStructure(sketch, parent);
                    continue;
                }

                // Create a new Matrix room for the sketch
                const link = getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl + '/spaces/' + sketch.id;
                await createSketchRoom(link, sketch.name, parent);
            }
        };

        // Function to sync spacedeck sketches with Matrix rooms
        const syncServerSketchesWithMatrix = async () => {
            setSyncingServerSketches(true);

            // Collect all Matrix sketches within the serviceSpaceId
            getAllMatrixSketches(serviceSpaceId);

            // Sync all spacedeck spaces and sketches
            const syncSketches = await spacedeck.syncAllSpaces().catch((error) => {
                logger.debug(error);
                checkServerStatus();
            });

            // Update the Matrix structure based on spacedeck sketches
            syncSketches && await updateStructure(spacedeck.getStructure());
            setSyncingServerSketches(false);
        };

        // Check if the useEffect is cancelled and required conditions are met to sync sketches
        if (!cancelled && serviceSpaceId && !_.isEmpty(serverSketches) && !syncingServerSketches) {
            console.log(serverSketches);
            syncServerSketchesWithMatrix();
        }

        return () => (cancelled = true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceSpaceId, serverSketches]);

    useEffect(() => {
        let cancelled = false;
        const MAX_SYNC_TRIES = 3;
        const populateSketchesFromServer = async (maxTries = 1) => {
            if (!_.isEmpty(spacedeck.getStructure())) {
                setServerSketches(spacedeck.getStructure());
            } else if (maxTries < MAX_SYNC_TRIES) {
                logger.debug(`${getOrdinalSuffix(maxTries)} attempt to sync spacedeck`);
                const syncSpacedeck = await spacedeck.syncAllSpaces();

                if (syncSpacedeck.status === 401 ||
                    syncSpacedeck.status === 403) {
                    const username = localStorage.getItem('mx_user_id').split('@').pop().split(':')[0];
                    const password = await loginPrompt('Please re-enter your password for ' + username)
                        .catch((error => setErrorMessage(t('no password provided'))
                        ));
                    if (password) {
                        await spacedeck.signin(username, password)
                            .catch(() => {});
                        await populateSketchesFromServer(maxTries + 1);
                    }
                }
            } else {
                logger.error('reached maximum number of tries, can’t sync spacedeck');
            }
        };
        !cancelled && getConfig().publicRuntimeConfig.authProviders.spacedeck.baseUrl && populateSketchesFromServer();

        return () => {
            cancelled = true;
        };
    }, [loginPrompt, spacedeck]);

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
            <Confirmation password={password} />
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
                            <ServiceTable.Body>
                                { spacedeckChildren?.map(spacedeckRoomId => {
                                    const room = matrix.rooms.get(spacedeckRoomId);
                                    if (!room) return null;

                                    return <ServiceLink
                                        key={spacedeckRoomId}
                                        name={room.name}
                                        href={`${spacedeckPath}/${spacedeckRoomId}`}
                                        selected={roomId === spacedeckRoomId}
                                        ref={spacedeckRoomId === roomId ? selectedSketchRef : null}
                                    />;
                                }) }
                            </ServiceTable.Body>
                        </ServiceTable>
                        { !isSpacedeckServerOnline && <ErrorMessage>{ t('Can\'t connect with the provided /sketch server. Please try again later.') }</ErrorMessage> }
                    </>

                }
            </IframeLayout.Sidebar>
            { roomId && content && (
                <IframeLayout.IframeWrapper>
                    <IframeLayout.IframeHeader>
                        <h2>{ matrix.rooms.get(roomId).name }</h2>
                        <IframeLayout.IframeHeaderButtonWrapper>
                            <InviteUserToMatrixRoom roomId={roomId} roomName={matrix.rooms.get(roomId).name} />
                            <CopyToClipboard title={t('Copy sketch link to clipboard')} content={content.body} />
                            <TextButton title={t('Delete sketch')} onClick={removeSketch}>
                                { isDeletingSketch ? <LoadingSpinnerInline /> : <Bin fill="var(--color-foreground)" /> }
                            </TextButton>
                        </IframeLayout.IframeHeaderButtonWrapper>
                    </IframeLayout.IframeHeader>
                    <iframe
                        title={spacedeckPath}
                        src={content.body}
                    />
                </IframeLayout.IframeWrapper>
            ) }
        </>
    );
}

Spacedeck.getLayout = () => {
    return IframeLayout.Layout;
};
