import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { DeleteBinIcon } from '@remixicons/react/line';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ErrorMessage from '../../components/UI/ErrorMessage';
import IframeLayout from '../../components/layouts/iframe';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import TextButton from '../../components/UI/TextButton';
import { ServiceTable } from '../../components/UI/ServiceTable';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import logger from '../../lib/Logging';
import ServiceLink from '../../components/UI/ServiceLink';
import CopyToClipboard from '../../components/UI/CopyToClipboard';
import CreateAnonymousPad from './actions/CreateAnonymousPad';
import AddExistingPad from './actions/AddExistingPad';
import CreateAuthoredPad from './actions/CreateAuthoredPad';
import CreatePasswordPad from './actions/CreatePasswordPad';
import { isMyPadsApiEnabled, path as etherpadPath } from '../../lib/Etherpad';

const EtherpadListEntry = memo(({ isPasswordProtected, name, href, etherpadId, ref, selected }) => {
    const etherpad = useAuth().getAuthenticationProvider('etherpad');

    const [showLock, setShowLock] = useState(isPasswordProtected);

    const checkIfPadHasPassword = useCallback(async (etherpadId) => {
        return etherpad.isPadPasswordProtected(etherpadId);
    }, [etherpad]);

    useEffect(() => {
        const askMyPadsApiIfPadIsPasswordProtected = async () => {
            const result = await checkIfPadHasPassword(etherpadId).catch(() => { setShowLock(false); });

            setShowLock(result);
        };

        if (_.isUndefined(isPasswordProtected)) {
            askMyPadsApiIfPadIsPasswordProtected();
        }
    }, [checkIfPadHasPassword, etherpadId, isPasswordProtected]);

    return <ServiceLink
        key={etherpadId}
        name={name}
        href={href}
        passwordProtected={showLock}
        selected={selected}
        ref={ref}
    />;
});

EtherpadListEntry.displayName = 'EtherpadListEntry';

export default function Etherpad() {
    const router = useRouter();
    const { t } = useTranslation('etherpad');

    const auth = useAuth();
    const matrix = useMatrix();

    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const etherpad = auth.getAuthenticationProvider('etherpad');

    const [serverPads, setServerPads] = useState(null);
    const [isDeletingPad, setIsDeletingPad] = useState(false);

    /**
     * A roomId is set when the route is /etherpad/<roomId>, otherwise it's undefined
     * @type {string | undefined}
     */
    const roomId = _.get(router, 'query.roomId.0');

    /**
     * The MyPads pad ID that can be used with the MyPads API
     * @type {string | undefined}
     */
    const myPadsPadId = _.get(matrix, ['roomContents', roomId, 'body'])?.substring(_.get(matrix, ['roomContents', roomId, 'body'])?.lastIndexOf('/') + 1);

    /**
     * If the currently visible pad can be accessed via the MyPads API, this will be the MyPads pad object; e.g.
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
     * @type {{name: string, group: string, users: [], visibility: string, readonly, _id: string, ctime: number} | undefined}
     */
    const myPadsObject = _.get(serverPads, myPadsPadId);

    // Whenever the roomId changes (e.g. after a new pad was created), automatically focus that element.
    // This makes the sidebar scroll to the element if it is outside of the current viewport.
    const selectedPadRef = useRef(null);
    useEffect(() => {
        selectedPadRef.current?.focus();
    }, [roomId]);

    const syncServerPadsAndSet = useCallback(async () => {
        await etherpad.syncAllPads().catch(() => setServerPads(null));
        setServerPads(etherpad.getAllPads());
    }, [etherpad]);

    useEffect(() => {
        let cancelled = false;

        const populatePadsFromServer = async () => {
            if (!_.isEmpty(etherpad.getAllPads())) {
                setServerPads(etherpad.getAllPads());
            } else {
                await syncServerPadsAndSet();
            }
        };

        !cancelled && isMyPadsApiEnabled && populatePadsFromServer();

        return () => {
            cancelled = true;
        };
    }, [etherpad, syncServerPadsAndSet]);

    const createWriteRoom = useCallback(async (link, name) => {
        if (!link || !name) return;

        logger.debug('Creating new Matrix room for pad', { link, name });

        const room = await matrix.createRoom(name, false, '', 'invite', 'content', 'etherpad');
        await auth.getAuthenticationProvider('matrix').addSpaceChild(matrix.serviceSpaces.etherpad, room);
        await matrixClient.sendMessage(room, {
            msgtype: 'm.text',
            body: link,
        });

        if (getConfig().publicRuntimeConfig.authProviders.etherpad.myPads?.api) {
            await etherpad.syncAllPads();
            setServerPads(etherpad.getAllPads());
        }

        return room;
    }, [auth, matrix, matrixClient, etherpad]);

    useEffect(() => {
        let cancelled = false;

        const syncServerPadsWithMatrix = async () => {
            let matrixPads = {};

            if (matrix?.spaces.get(matrix.serviceSpaces.etherpad).children) {
                // if there are rooms within the space id we grab the names of those room
                for (const roomId of matrix.spaces.get(matrix.serviceSpaces.etherpad).children) {
                    if (!matrix.rooms.get(roomId) || !matrix.roomContents.get(roomId)?.body) { continue; }
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
                const link = getConfig().publicRuntimeConfig.authProviders.etherpad.baseUrl + '/' + pad._id;
                await createWriteRoom(link, pad.name);
            }
        };

        !cancelled && matrix.serviceSpaces.etherpad && serverPads && syncServerPadsWithMatrix();

        return () => { cancelled = true; };
        // if we add matrix[key] to the dependency array we end up creating infinite loops in the event of someone creating pads within MyPads that are then synced here.
        // therefore we need to disable the linter for the next line
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matrix.serviceSpaces.etherpad, serverPads, createWriteRoom]);

    /**
     * Removes the given pad from the user's library, and also deletes the pad entirely via API if possible.
     */
    const deletePad = async () => {
        // Confirm if the user really wants to remove/delete this pad ...
        let confirmDeletionMessage;

        if (myPadsObject) {
            confirmDeletionMessage = t('This is going to delete the pad and all of its content.');
        } else {
            confirmDeletionMessage = t('This will remove the pad from your library. The contents of the pad will remain accessible to anyone who has the link to it.');
        }

        // ... and cancel the process if the user decided otherwise.
        if (!confirm(confirmDeletionMessage)) return;

        setIsDeletingPad(true);

        // If this pad is known by MyPads we'll try to delete it altogether
        if (myPadsObject) {
            await etherpad.deletePadById(myPadsObject._id);
        }

        await auth.getAuthenticationProvider('matrix').removeSpaceChild(matrix.serviceSpaces.etherpad, roomId);
        await matrix.leaveRoom(roomId);

        await syncServerPadsAndSet();

        router.push(etherpadPath);
        setIsDeletingPad(false);
    };

    const submenuItems = _.filter([
        { value: 'existingPad', actionComponentToRender: <AddExistingPad createWriteRoom={createWriteRoom} />, label: t('Add existing pad') },
        { value: 'anonymousPad', actionComponentToRender: <CreateAnonymousPad createWriteRoom={createWriteRoom} />, label: t('Create new anonymous pad') },
        isMyPadsApiEnabled && { value: 'authoredPad', actionComponentToRender: <CreateAuthoredPad createWriteRoom={createWriteRoom} />, label: t('Create new authored pad') },
        isMyPadsApiEnabled && { value: 'passwordPad', actionComponentToRender: <CreatePasswordPad createWriteRoom={createWriteRoom} />, label: t('Create password protected pad') },
    ]);

    const listEntries = useMemo(() => {
        return matrix.spaces.get(matrix.serviceSpaces.etherpad)?.children?.map(writeRoomId => {
            const name = _.get(matrix.rooms.get(writeRoomId), 'name');
            const etherpadId = matrix.roomContents.get(writeRoomId)?.body.substring(matrix.roomContents.get(writeRoomId)?.body.lastIndexOf('/') + 1);

            // if the room name is undefined we don't want to display it
            if (!name) return;

            console.log(etherpadId, _.has(serverPads, etherpadId) ? _.get(serverPads, [etherpadId, 'visibility']) === 'private' : undefined);

            return <EtherpadListEntry
                key={writeRoomId}
                name={name}
                href={`${etherpadPath}/${writeRoomId}`}
                isPasswordProtected={_.has(serverPads, etherpadId) ? _.get(serverPads, [etherpadId, 'visibility']) === 'private' : undefined}
                etherpadId={etherpadId}
                selected={writeRoomId === roomId}
                ref={writeRoomId === roomId ? selectedPadRef : null}
            />;
        });
    }, [matrix.roomContents, matrix.rooms, matrix.serviceSpaces.etherpad, matrix.spaces, roomId, serverPads]);

    // Add the following parameters to the iframe URL:
    // - user's Matrix displayname as parameter so that it shows up in Etherpad as username
    // - user's MyPads auth token so that we skip having to enter a password for password protected pads owned by user
    let iframeUrl;

    if (roomId && matrix.roomContents.get(roomId)?.body) {
        iframeUrl = new URL(matrix.roomContents.get(roomId).body);
        iframeUrl.searchParams.set('userName', auth.user.displayname);
        iframeUrl.searchParams.set('auth_token', etherpad.getToken());
    }

    return (
        <>
            <IframeLayout.Sidebar>
                { !matrix.serviceSpaces.etherpad ? (
                    <>
                        <h2>{ etherpadPath }</h2>
                        <LoadingSpinner />
                    </>
                ) : (
                    <>
                        <ServiceSubmenu
                            title={<h2>{ etherpadPath }</h2>}
                            subheadline={t('What would you like to do?')}
                            items={submenuItems} />
                        { getConfig().publicRuntimeConfig.authProviders.etherpad.myPads?.api && !serverPads && <ErrorMessage>{ t('Can\'t connect to the provided {{path}} server. Please try again later.', { path: etherpadPath }) }</ErrorMessage> }
                        <ServiceTable>
                            <ServiceTable.Body>
                                { listEntries }
                            </ServiceTable.Body>
                        </ServiceTable>
                    </>
                ) }
            </IframeLayout.Sidebar>
            { roomId && matrix.roomContents.get(roomId) && (
                <IframeLayout.IframeWrapper>
                    <IframeLayout.IframeHeader>
                        <h2>{ matrix.rooms.get(roomId).name }</h2>
                        <IframeLayout.IframeHeaderButtonWrapper>
                            <CopyToClipboard title={t('Copy pad link to clipboard')} content={matrix.roomContents.get(roomId)?.body} />
                            <TextButton title={t(myPadsObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deletePad}>
                                { isDeletingPad ? <LoadingSpinnerInline /> : <DeleteBinIcon width="var(--icon-size)" height="var(--icon-size)" fill="var(--color-foreground)" /> }
                            </TextButton>
                        </IframeLayout.IframeHeaderButtonWrapper>
                    </IframeLayout.IframeHeader>
                    <iframe
                        title={etherpadPath}
                        src={iframeUrl.toString()}
                    />
                </IframeLayout.IframeWrapper>
            ) }
        </>
    );
}

Etherpad.getLayout = () => {
    return IframeLayout.Layout;
};
