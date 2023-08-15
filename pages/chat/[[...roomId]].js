import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import _, { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import IframeLayout from '../../components/layouts/iframe';
import { ServiceSubmenu } from '../../components/UI/ServiceSubmenu';
import Form from '../../components/UI/Form';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '../../components/UI/ServiceTable';
import Bin from '../../assets/icons/bin.svg';
import TextButton from '../../components/UI/TextButton';
import { breakpoints } from '../../components/_breakpoints';

const sortRooms = function(room) {
    return [
        room.notificationCount === 0,
        room.name,
    ];
};

const UnreadNotificationBadge = styled.span`
  position: relative;
  display: flex;
  flex: 0 0;
  padding: 0.1rem 0.5rem;
  margin-left: 0.6rem;
  color: white;
  text-decoration: none;
  background: red;
  border-radius: 2rem;
`;

const Avatar = styled.img`
  position: relative;
  width: 2rem;
  height: 2rem;
  margin-right: 0.6rem;
  background: var(--color-foreground);
`;

const Checkbox = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SidebarListEntry = function({ room }) {
    const [isLeavingRoom, setIsLeavingRoom] = useState(false);
    const { t } = useTranslation();
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const handleLeave = async (roomId) => {
        setIsLeavingRoom(true);
        await matrix.leaveRoom(roomId)
            .catch(error => console.debug(error));
        setIsLeavingRoom(false);
    };

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell selected={false}>
                <Link href={`/chat/${room.roomId}`} passHref>
                    <span>
                        { room.avatar && (
                        // Render the avatar if we have one
                            <Avatar src={room.avatar} alt={room.name} />
                        ) }
                        { /* { room.avatar ? (
                    // Render the avatar if we have one
                        <Avatar src={room.avatar} alt={room.name} />
                    ) : (
                    // Render an empty GIF if we don't have an avatar
                        <Avatar src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
                    ) } */ }
                        { room.name }
                        { room.notificationCount > 0 && (
                            <UnreadNotificationBadge>{ room.notificationCount }</UnreadNotificationBadge>
                        ) }
                    </span>
                </Link>
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <TextButton title={t('Leave room and remove from my library')} onClick={() => handleLeave(room.roomId)}>
                    { isLeavingRoom ? <LoadingSpinnerInline /> : <Bin fill="var(--color-foreground)" /> }
                </TextButton>
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
};

export default function RoomId() {
    const auth = useAuth();
    const iframe = useRef();
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');
    const { t } = useTranslation('chat');
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    // Injecting custom CSS into the Element <iframe>
    useEffect(() => {
        const iframeReference = iframe.current;
        if (!iframeReference) return;

        const injectCss = () => {
            const styleTag = document.createElement('style');
            const styleContent = document.createTextNode(`
                * { border-radius: unset !important }
                .mx_LeftPanel_outerWrapper, .mx_LeftPanel_outerWrapper + .mx_ResizeHandle_horizontal { display: none !important }
                .mx_RightPanel_roomSummaryButton, .mx_RightPanel_notifsButton { display: none }
                .mx_RoomHeader_name { pointer-events: none }
                .mx_RoomHeader_chevron { display: none }
                /* Hides the "Logout" button at the bottom of Element when loading for the first time */
                .mx_MatrixChat_splashButtons { display: none }
                /* Hide the search bar buttons to only allow searching inside current room */
                .mx_SearchBar_buttons { display: none !important }

                /* @TODO: This can be improved... and should probably not target mobile viewports. It's to make the */
                /* header look like it's on line with our header elements from first & second sidebar. */
                .mx_RoomHeader_wrapper { height: unset; padding: 0; border-bottom: none }
                .mx_RoomHeader { flex: unset; -webkit-box-flex: unset; padding: 2.85rem 0 } 
                .mx_RoomHeader_name { font-weight: bold }
                .mx_HomePage_default_buttons { display: initial !important }
                .mx_HomePage_default_wrapper > div:first-child { display: none }
                .mx_RoomHeader {
                    position: absolute; right: 0; left: 0; z-index: 10;
                    background: rgba(255, 255, 255, 90%); backdrop-filter: blur(4px);
                    padding: 1.65rem 0;
                } 
                .mx_RoomHeader_wrapper { height: unset; padding: 0; border-bottom: unset }
                .mx_SearchBar {
                    position: absolute; right: 0; left: 0; bottom: 0; z-index: 10;
                    background: rgba(255, 255, 255, 90%); backdrop-filter: blur(4px);
                    border-top: 1px solid var(--roomlist-separator-color);
                }
                .mx_RoomView_searchResultsPanel .mx_RoomView_messageListWrapper { padding-bottom: 80px; } 
                .mx_RoomView_messageListWrapper { padding-top: 140px; }

                @media ${breakpoints.phoneOnly} {
                    .mx_RoomHeader { padding: 1rem var(--RoomView_MessageList-padding) }
                    
                    .mx_RoomHeader_wrapper { flex-wrap: wrap }
                    .mx_RoomHeader_avatar { flex: 0 1 1% }
                    .mx_RoomHeader_name { font-weight: bold; flex: 1 0 }
                    .mx_RoomTopic { flex: 0 0 100%; margin: 12px 6px }

                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_EventTile_line,
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_ThreadSummary,
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_ThreadSummary_icon { margin-right: unset }
                }
            `);
            styleTag.appendChild(styleContent);
            iframeReference.contentDocument.getElementsByTagName('html')[0].appendChild(styleTag);
        };

        iframeReference.addEventListener('load', injectCss);

        return () => {
            iframeReference && iframeReference.removeEventListener('load', injectCss);
        };
    });

    const invites = _.sortBy([...matrix.invites.values()], sortRooms);
    const directMessages = _.sortBy([...matrix.directMessages.values()], sortRooms);
    // Other rooms contains all rooms, except for the ones that ...
    const otherRooms = _([...matrix.rooms.values()])
        // ... are direct messages,
        .reject(room => matrix.directMessages.has(room.roomId))
        // ... are medienhaus/ CMS related rooms (so if they have a dev.medienhaus.meta event which is NOT "type: chat")
        .reject(room => room.events.get('dev.medienhaus.meta') && room.events.get('dev.medienhaus.meta').values().next().value.getContent()?.template !== 'chat')
        .sortBy(sortRooms)
        .value();

    const ActionNewRoom = ({ callbackDone }) => {
        const [roomName, setRoomName] = useState('');
        const [topic, setTopic] = useState('');
        const [encrypted, setEncrypted] = useState(false);
        const [isLoading, setIsLoading] = useState(false);

        const createNewRoom = async () => {
            setIsLoading(true);
            // eslint-disable-next-line no-undef
            if (process.env.NODE_ENV === 'development') console.log('creating room for ' + roomName);
            await matrix.createRoom(roomName, false, topic, 'invite', 'item', 'chat', getConfig().publicRuntimeConfig.name, 'private', 'shared', encrypted)
                .catch((error => console.debug(error)));
            // router.push(`/chat/${roomId}`);

            callbackDone && callbackDone();
            setIsLoading(false);
        };

        return (
            <Form onSubmit={(e) => { e.preventDefault(); createNewRoom(); }}>
                <input type="text" placeholder={t('room name')} value={roomName} onChange={(e) => setRoomName(e.target.value)} />
                <input type="text" placeholder={t('topic (optional)')} value={topic} onChange={(e) => setTopic(e.target.value)} />
                <Checkbox><label htmlFor="encrypted">Encrypted</label><input type="checkbox" name="encrypted" checked={encrypted} onChange={() => setEncrypted(prevState => !prevState)} /></Checkbox>
                <button type="submit" disabled={!roomName}>{ isLoading ?<LoadingSpinnerInline inverted /> : t('Create room') }</button>
            </Form>
        );
    };

    const submenuItems = _.filter([
        { value: 'newRoom', actionComponentToRender: ActionNewRoom, label: t('New room') },

    ]);

    return (
        <>
            <IframeLayout.Sidebar>
                <ServiceSubmenu
                    title={<h2>/chat</h2>}
                    subheadline={t('What would you like to do?')}
                    items={submenuItems} />
                { matrix.invites.size > 0 && (
                    <>
                        <details open>
                            <summary><h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{ t('Invites') }</h3></summary>
                            { invites && invites.map((room) => <SidebarListEntry key={room.roomId} room={room} />) }
                        </details>
                        <br />
                    </>
                ) }
                <details open>
                    <summary><h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{ t('People') }</h3></summary>
                    { directMessages && directMessages.map((room) => <SidebarListEntry key={room.roomId} room={room} />) }
                </details>
                <br />
                <details open>
                    <summary><h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{ t('Rooms') }</h3></summary>
                    { otherRooms && otherRooms.map((room) => {
                        return <ServiceTable><SidebarListEntry key={room.roomId} room={room} /></ServiceTable>;
                    }) }
                </details>
                <br />
            </IframeLayout.Sidebar>

            <IframeLayout.IframeWrapper>
                <iframe src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/${roomId ? 'room/' + roomId : 'home' }`} ref={iframe} />
            </IframeLayout.IframeWrapper>
        </>
    );
}

RoomId.getLayout = () => {
    return IframeLayout.Layout;
};
