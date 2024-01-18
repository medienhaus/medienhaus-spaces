'use client';
import { memo, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Trans, useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import _, { set } from 'lodash';
import { useImmer } from 'use-immer';
import { DeleteBinIcon } from '@remixicons/react/line';

import { useAuth } from '../../lib/Auth';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { useMatrix } from '../../lib/Matrix';
import ErrorMessage from '../../components/UI/ErrorMessage';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import DefaultLayout from '../../components/layouts/default';
import { ServiceTable } from '../../components/UI/ServiceTable';
import ServiceLink from '../../components/UI/ServiceLink';
import { path as tldrawPath } from '../../lib/Tldraw';
import { TldrawMatrixProvider } from './tldrawMatrix';
import CreateNewTlDrawSketch from './actions/CreateNewTlDrawSketch';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import { InviteUserToMatrixRoom } from '../../components/UI/InviteUsersToMatrixRoom';
import TextButton from '../../components/UI/TextButton';
import Icon from '../../components/UI/Icon';

const Editor = dynamic(() => import('./editor'), { ssr: false });

const TlDrawListEntry = memo(({ name, href, roomId, ref, selected }) => {
    return <ServiceLink
        key={roomId}
        name={name}
        href={href}
        selected={selected}
        ref={ref}
    />;
});

TlDrawListEntry.displayName = 'TlDrawListEntry';

export default function Draw() {
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const { t } = useTranslation('tldraw');
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');

    const [errorMessage, setErrorMessage] = useState(false);
    const serviceSpaceId = matrix.serviceSpaces.tldraw;
    const spacedeckChildren = matrix.spaces.get(serviceSpaceId)?.children?.filter(child => child !== 'undefined'); // Filter out any undefined values to ensure 'spacedeckChildren' only contains valid objects
    const [syncingServerSketches, setSyncingServerSketches] = useState(false);

    const tldrawMatrix = TldrawMatrixProvider(roomId);
    const [isInviteUsersOpen, setIsInviteUsersOpen] = useState(false);
    const [isDeletingSketch, setIsDeletingSketch] = useState(false);

    // Whenever the roomId changes (e.g. after a new sketch was created), automatically focus that element.
    // This makes the sidebar scroll to the element if it is outside of the current viewport.
    const selectedSketchRef = useRef(null);
    useEffect(() => {
        console.error('roomId::', roomId);
        setIsInviteUsersOpen(false);

        // setTldrawMatrix(TldrawMatrixProvider(roomId));
        selectedSketchRef.current?.focus();
    }, [roomId]);

    const listEntries = useMemo(() => {
        return matrix.spaces.get(matrix.serviceSpaces.tldraw)?.children?.map(tldrawRoomId => {
            const name = _.get(matrix.rooms.get(tldrawRoomId), 'name');

            // if the room name is undefined we don't want to display it
            if (!name) return;

            return <TlDrawListEntry
                key={tldrawRoomId}
                name={name}

                roomId={tldrawRoomId}
                selected={tldrawRoomId === roomId}

            />;
        });
    }, [matrix.rooms, matrix.serviceSpaces.tldraw, matrix.spaces, roomId]);

    // based on the createWriteRoom in etherpad. there was a @TODO mentioned with 'function creates infinite loop in useEffect below' dont know if this applies here as well.
    const createSketchRoom = useCallback(async (name) => {
        if (!name) return;

        const newRoom = await matrix.createRoom(name, false, '', 'public', 'item', 'tldraw-sketch', serviceSpaceId);

        // we add the defualt store schama data and the store data as an custom stateevent to the newly created room
        await matrixClient.sendStateEvent(newRoom, 'dev.medienhaus.tldraw.store.schema', JSON.stringify({ 'schemaVersion': 1, 'storeVersion': 4, 'recordVersions': { 'asset': { 'version': 1, 'subTypeKey': 'type', 'subTypeVersions': { 'image': 2, 'video': 2, 'bookmark': 0 } }, 'camera': { 'version': 1 }, 'document': { 'version': 2 }, 'instance': { 'version': 22 }, 'instance_page_state': { 'version': 5 }, 'page': { 'version': 1 }, 'shape': { 'version': 3, 'subTypeKey': 'type', 'subTypeVersions': { 'group': 0, 'text': 1, 'bookmark': 1, 'draw': 1, 'geo': 7, 'note': 4, 'line': 1, 'frame': 0, 'arrow': 2, 'highlight': 0, 'embed': 4, 'image': 2, 'video': 1 } }, 'instance_presence': { 'version': 5 }, 'pointer': { 'version': 1 } } }));
        await matrixClient.sendStateEvent(newRoom, 'dev.medienhaus.tldraw.store.store', JSON.stringify({ 'document:document': { 'gridSize': 10, 'name': '', 'meta': {}, 'id': 'document:document', 'typeName': 'document' }, 'page:page': { 'meta': {}, 'id': 'page:page', 'name': 'Page 1', 'index': 'a1', 'typeName': 'page' } }));

        await auth.getAuthenticationProvider('matrix').addSpaceChild(matrix.serviceSpaces.tldraw, newRoom);

        return newRoom;
    }, [matrix, auth, serviceSpaceId, matrixClient]);

    /**
     * copied from etherpad and modified to fit our needs
     */
    const deleteSketch = async () => {
        // Confirm if the user really wants to remove/delete this pad ...
        let confirmDeletionMessage;

        // ... and cancel the process if the user decided otherwise.
        if (!confirm(confirmDeletionMessage)) return;

        setIsDeletingSketch(true);

        await auth.getAuthenticationProvider('matrix').removeSpaceChild(matrix.serviceSpaces.etherpad, roomId);
        await matrix.leaveRoom(roomId);

        router.push(tldrawPath);
        setIsDeletingSketch(false);
    };

    return (
        <>
            <DefaultLayout.Sidebar>
                <ServiceSubmenu
                    title={<h2>{ tldrawPath }</h2>}
                    subheadline={t('What would you like to do?')}
                    disabled={!serviceSpaceId}
                    items={[
                        { value: 'createtldrawsketch', actionComponentToRender: <CreateNewTlDrawSketch createTlDrawRoom={createSketchRoom} />, label: t('Create new sketch') },
                    ]}
                />
                { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
                { !serviceSpaceId || syncingServerSketches ?
                    <LoadingSpinner /> :
                    <>
                        <ServiceTable>
                            <ServiceTable.Body>
                                { spacedeckChildren?.map(tldrawSketchRoomId => {
                                    const room = matrix.rooms.get(tldrawSketchRoomId);
                                    if (!room) return null;

                                    return <ServiceLink
                                        key={tldrawSketchRoomId}
                                        name={room.name}
                                        href={`${tldrawPath}/${tldrawSketchRoomId}`}
                                        selected={roomId === tldrawSketchRoomId}
                                        ref={tldrawSketchRoomId === roomId ? selectedSketchRef : null}
                                    />;
                                }) }
                            </ServiceTable.Body>
                        </ServiceTable>

                    </>

                }
            </DefaultLayout.Sidebar>
            { roomId && (
                <DefaultLayout.IframeWrapper>
                    <DefaultLayout.IframeHeader>
                        <h2>{ matrix.rooms.get(roomId).name }</h2>
                        <DefaultLayout.IframeHeaderButtonWrapper>
                            <InviteUserToMatrixRoom.Button
                                name={matrix.rooms.get(roomId).name}
                                onClick={() => setIsInviteUsersOpen(prevState => !prevState)}
                                inviteUsersOpen={isInviteUsersOpen} />
                            <CopyToClipboard title={t('Copy sketch link to clipboard')}
                                content={tldrawPath+'/'+roomId} />
                            <TextButton title={t('Remove sketch from my library')}
                                onClick={deleteSketch}>
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

                    { tldrawMatrix && tldrawMatrix.store && <Editor store={tldrawMatrix.store} updateStoreElement={tldrawMatrix.updateStoreElementInMatrix} addStoreElement={tldrawMatrix.addStoreElementToMatrix} deleteStoreElement={tldrawMatrix.deleteStoreElementInMatrix} /> }

                </DefaultLayout.IframeWrapper>
            ) }
        </>

    );
}
