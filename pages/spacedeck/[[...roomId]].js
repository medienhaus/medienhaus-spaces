import getConfig from 'next/config';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { logger } from 'matrix-js-sdk/lib/logger';
import { DeleteBinIcon } from '@remixicons/react/line';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import ErrorMessage from '../../components/UI/ErrorMessage';
import Icon from '../../components/UI/Icon';
import TextButton from '../../components/UI/TextButton';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import DefaultLayout from '../../components/layouts/default';
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
    const spacedeckChildren = matrix.spaces.get(serviceSpaceId)?.children?.filter(child => child !== 'undefined'); // Filter out any undefined values to ensure 'spacedeckChildren' only contains valid objects
    const [isDeletingSketch, setIsDeletingSketch] = useState(false);
    const [serverSketches, setServerSketches] = useState({});
    const content = matrix.roomContents.get(roomId);
    const [isSyncingSpacedeckServer, setIsSyncingSpacedeckServer] = useState(false);
    const [isSpacedeckServerDown, setIsSpacedeckServerDown] = useState(false);

    const spacedeck = auth.getAuthenticationProvider('spacedeck');

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
        const getAllMatrixSketches = (id) => {
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
            setIsSyncingSpacedeckServer(true);

            // Collect all Matrix sketches within the serviceSpaceId
            getAllMatrixSketches(serviceSpaceId);

            // Sync all Spacedeck spaces and folders
            const syncSketches = await spacedeck.syncAllSpaces().catch((error) => {
                logger.debug(error);
                setIsSpacedeckServerDown(true);
            });

            // Update the Matrix structure based on spacedeck sketches
            syncSketches && await updateStructure(spacedeck.getStructure());

            setIsSyncingSpacedeckServer(false);
        };

        // Check if the useEffect is cancelled and required conditions are met to sync sketches
        if (!cancelled && serviceSpaceId && serverSketches && !isSyncingSpacedeckServer) {
            syncServerSketchesWithMatrix();
        }

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceSpaceId, serverSketches]);

    useEffect(() => {
        let cancelled = false;

        const populateSketchesfromServer = async (recursion) => {
            if (!_.isEmpty(spacedeck.getStructure())) {
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
        // Create the room with retry handling
        const room = await matrix.createRoom(name, false, '', 'invite', 'content', 'spacedeck')
            .catch(error => setErrorMessage(error));

        // Log debug information about current progress
        logger.debug(`Created room for ${name} with id ${room}`);

        // Add the room as a child to the parent space
        await matrix.addSpaceChild(parent, room)
            .catch(error => setErrorMessage(error));

        // Log debug information about current progress
        logger.debug('Added %s to parent %s', name, parent);

        // Send the message to the room with retry handling
        await matrix.sendMessage(room, link)
            .catch(error => setErrorMessage(error));

        return room;
    }

    const removeSketch = async () => {
        setIsDeletingSketch(true);
        const remove = await spacedeck.deleteSpaceById(content.body.substring(content.body.lastIndexOf('/') + 1)).catch((e) => logger.debug(e));

        if (!remove || !remove.ok) {
            setIsDeletingSketch(false);
            alert(t('Something went wrong when trying to delete the sketch, please try again or if the error persists, try logging out and logging in again.'));

            return;
        }

        await auth.getAuthenticationProvider('matrix').removeSpaceChild(serviceSpaceId, roomId);
        await matrix.leaveRoom(roomId);
        router.push(`${spacedeckPath}`);
        setIsDeletingSketch(false);
    };

    return (
        <>
            <DefaultLayout.Sidebar>
                { /* Show only a loading spinner in the sidebar until we know about our Spacedeck service space ID */ }
                { !serviceSpaceId ? (
                    <>
                        <h2>{ spacedeckPath }</h2>
                        <LoadingSpinner />
                    </>
                ) : (
                    <>
                        <ServiceSubmenu
                            title={<h2>{ spacedeckPath }</h2>}
                            subheadline={t('What would you like to do?')}
                            items={[
                                { value: 'existingSketch', actionComponentToRender: <AddExistingSketch createSketchRoom={createSketchRoom} errorMessage={errorMessage} />, label: t('Add existing sketch') },
                                { value: 'newSketch', actionComponentToRender: <CreateNewSketch createSketchRoom={createSketchRoom} errorMessage={errorMessage} />, label: t('Create new sketch') },
                            ]}
                        />
                        { errorMessage && <ErrorMessage>{ t(errorMessage) }</ErrorMessage> }
                        <ServiceTable>
                            <ServiceTable.Body>
                                { isSyncingSpacedeckServer && (
                                    <ServiceTable.Row>
                                        <ServiceTable.Cell>
                                            <LoadingSpinnerInline style={{ float: 'right', position: 'relative', top: '0.85rem' }} />
                                            <span style={{ color: 'var(--color-disabled)' }}>
                                                { t('Syncing more entries') } …
                                            </span>
                                        </ServiceTable.Cell>
                                    </ServiceTable.Row>
                                ) }
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
                        { isSpacedeckServerDown && <ErrorMessage>{ t('Can\'t connect with the provided /sketch server. Please try again later.') }</ErrorMessage> }
                    </>
                ) }
            </DefaultLayout.Sidebar>
            { roomId && content && (
                <DefaultLayout.IframeWrapper>
                    <DefaultLayout.IframeHeader>
                        <h2>{ matrix.rooms.get(roomId).name }</h2>
                        <DefaultLayout.IframeHeaderButtonWrapper>
                            <CopyToClipboard title={t('Copy sketch link to clipboard')} content={content.body} />
                            <TextButton title={t('Delete sketch')} onClick={removeSketch}>
                                { isDeletingSketch ?
                                    <LoadingSpinnerInline />
                                    :
                                    <Icon>
                                        <DeleteBinIcon />
                                    </Icon>
                                }
                            </TextButton>
                        </DefaultLayout.IframeHeaderButtonWrapper>
                    </DefaultLayout.IframeHeader>
                    <iframe
                        title={spacedeckPath}
                        src={content.body}
                    />
                </DefaultLayout.IframeWrapper>
            ) }
        </>
    );
}
