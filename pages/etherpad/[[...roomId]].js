import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import _ from 'lodash';
import { useRouter } from 'next/router';
import { DeleteBinIcon, UserAddIcon, UserUnfollowIcon } from '@remixicons/react/line';

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
import InviteUserToMatrixRoom from '../../components/UI/InviteUsersToMatrixRoom';
import { path as etherpadPath } from '../../lib/Etherpad';
import useServerStatus from '../../components/useServerStatus';
import useConfirm from '../../components/UI/useLoginPrompt';

export default function Etherpad() {
    const auth = useAuth();
    const matrix = useMatrix();

    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const etherpad = auth.getAuthenticationProvider('etherpad');
    const [isSpacedeckServerOnline, checkServerStatus] = useServerStatus(etherpad.url);

    const { t } = useTranslation('etherpad');
    const router = useRouter();
    const [serverPads, setServerPads] = useState({});
    const [isDeletingPad, setIsDeletingPad] = useState(false);
    const [isInviteUsersOpen, setIsInviteUsersOpen] = useState(false);
    const { loginPrompt, Confirmation, password } = useConfirm();

    /**
     * A roomId is set when the route is /etherpad/<roomId>, otherwise it's undefined
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
    const mypadsPadObject = roomId && matrix.roomContents.get(roomId)?.body && serverPads[matrix.roomContents.get(roomId).body.substring(matrix.roomContents.get(roomId).body.lastIndexOf('/') + 1)];

    // Whenever the roomId changes (e.g. after a new pad was created), automatically focus that element.
    // This makes the sidebar scroll to the element if it is outside of the current viewport.
    const selectedPadRef = useRef(null);
    useEffect(() => {
        selectedPadRef.current?.focus();
        // closing any other open user function in case they are open
        setIsInviteUsersOpen(false);
    }, [roomId]);

    const syncServerPadsAndSet = useCallback(async (maxTries = 0) => {
        if (maxTries > 3) return setServerPads(null);

        const loginForm = async (maxTries) => {
            const username = localStorage.getItem('mx_user_id').split('@').pop().split(':')[0];
            const password = await loginPrompt('Please re-enter your password for ' + username);
            if (password) {
                await etherpad.signin(username, password)
                    .catch(() => {});

                return await syncServerPadsAndSet(maxTries + 1);
            } //@TODO else display error

            return false;
        };

        const syncMyPads = await etherpad.syncAllPads().catch(() => setServerPads(null));
        if (syncMyPads.status === 401 || syncMyPads.status === 403) {
            await loginForm(maxTries);

            return;
        }

        setServerPads(syncMyPads);
    }, [etherpad, loginPrompt]);

    useEffect(() => {
        let cancelled = false;

        const populatePadsfromServer = async () => {
            if (!_.isEmpty(etherpad.getAllPads())) {
                setServerPads(etherpad.getAllPads());
            } else {
                await syncServerPadsAndSet();
            }
        };
        !cancelled && getConfig().publicRuntimeConfig.authProviders.etherpad.myPads?.api && isSpacedeckServerOnline && populatePadsfromServer();

        return () => {
            cancelled = true;
        };
    }, [syncServerPadsAndSet, etherpad]);

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
        // if we add matrix[key] to the dependency array we end up creating infinite loops in the event of someone creating pads within mypads that are then synced here.
        // therefore we need to disable the linter for the next line
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matrix.serviceSpaces.etherpad, serverPads, createWriteRoom]);

    /**
     * Removes the given pad from the user's library, and also deletes the pad entirely via API if possible.
     */
    const deletePad = async () => {
        // Confirm if the user really wants to remove/delete this pad ...
        let confirmDeletionMessage;
        if (mypadsPadObject) {
            confirmDeletionMessage = t('This is going to delete the pad and all of its content.');
        } else {
            confirmDeletionMessage = t('This will remove the pad from your library. The contents of the pad will remain accessible to anyone who has the link to it.');
        }

        // ... and cancel the process if the user decided otherwise.
        if (!confirm(confirmDeletionMessage)) return;

        setIsDeletingPad(true);

        // If this pad is known by mypads we'll try to delete it altogether
        if (mypadsPadObject) {
            await etherpad.deletePadById(mypadsPadObject._id);
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
        getConfig().publicRuntimeConfig.authProviders.etherpad.myPads?.api && { value: 'authoredPad', actionComponentToRender: <CreateAuthoredPad createWriteRoom={createWriteRoom} />, label: t('Create new authored pad') },
        getConfig().publicRuntimeConfig.authProviders.etherpad.myPads?.api && { value: 'passwordPad', actionComponentToRender: <CreatePasswordPad createWriteRoom={createWriteRoom} />, label: t('Create password protected pad') },
    ]);

    // Add the user's Matrix displayname as parameter so that it shows up in Etherpad as username
    let iframeUrl;
    if (roomId && matrix.roomContents.get(roomId)?.body) {
        iframeUrl = new URL(matrix.roomContents.get(roomId).body);
        iframeUrl.searchParams.set('userName', auth.user.displayname);
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
                                { matrix.spaces.get(matrix.serviceSpaces.etherpad).children?.map(writeRoomId => {
                                    const name = _.get(matrix.rooms.get(writeRoomId), 'name');

                                    // if the room name is undefined we don't want to display it
                                    if (!name) return;

                                    return <ServiceLink
                                        key={writeRoomId}
                                        name={_.get(matrix.rooms.get(writeRoomId), 'name')}
                                        href={`${etherpadPath}/${writeRoomId}`}
                                        passwordProtected={serverPads[matrix.roomContents.get(writeRoomId)?.body.substring(matrix.roomContents.get(writeRoomId)?.body.lastIndexOf('/') + 1)]?.visibility === 'private'}
                                        selected={writeRoomId === roomId}
                                        ref={writeRoomId === roomId ? selectedPadRef : null}
                                    />;
                                }) }
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
                            <TextButton title={t('Invite users to' + ' ' + matrix.rooms.get(roomId).name)} onClick={() => setIsInviteUsersOpen(prevState => !prevState)}>
                                { isInviteUsersOpen ? <UserUnfollowIcon width="24" height="24" fill="var(--color-foreground)" /> : <UserAddIcon width="24" height="24" fill="var(--color-foreground)" /> }
                            </TextButton>

                            <CopyToClipboard title={t('Copy pad link to clipboard')} content={matrix.roomContents.get(roomId)?.body} />
                            <TextButton title={t(mypadsPadObject ? 'Delete pad' : 'Remove pad from my library')} onClick={deletePad}>
                                { isDeletingPad ? <LoadingSpinnerInline /> : <DeleteBinIcon width="24" height="24" fill="var(--color-foreground)" /> }
                            </TextButton>
                        </IframeLayout.IframeHeaderButtonWrapper>
                    </IframeLayout.IframeHeader>
                    { isInviteUsersOpen ?
                        <InviteUserToMatrixRoom
                            roomId={roomId}
                            roomName={matrix.rooms.get(roomId).name}
                            onSuccess={() => setIsInviteUsersOpen(false)}
                        /> :
                        <iframe
                            title={etherpadPath}
                            src={iframeUrl.toString()}
                        />
                    }
                </IframeLayout.IframeWrapper>
            ) }
            <Confirmation password={password} />
        </>
    );
}

Etherpad.getLayout = () => {
    return IframeLayout.Layout;
};
