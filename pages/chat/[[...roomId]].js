import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import IframeLayout from '../../components/layouts/iframe';
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

const SidebarListEntryWrapper = styled.a`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 0.3rem;
`;

const RoomName = styled.span`
  flex: 1 0;
  height: 2rem;
  overflow: hidden;
  line-height: 2rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SidebarListEntry = function({ room }) {
    return (
        <Link href={`/chat/${room.roomId}`} passHref>
            <SidebarListEntryWrapper>
                { room.avatar ? (
                    // Render the avatar if we have one
                    <Avatar src={room.avatar} alt={room.name} />
                ) : (
                    // Render an empty GIF if we don't have an avatar
                    <Avatar src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
                ) }
                <RoomName>{ room.name }</RoomName>
                { room.notificationCount > 0 && (
                    <UnreadNotificationBadge>{ room.notificationCount }</UnreadNotificationBadge>
                ) }
            </SidebarListEntryWrapper>
        </Link>
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

    return (
        <>
            <IframeLayout.Sidebar>
                <h2>/chat</h2>
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
                    { otherRooms && otherRooms.map((room) => <SidebarListEntry key={room.roomId} room={room} />) }
                </details>
                <br />
            </IframeLayout.Sidebar>
            { roomId && (
                <IframeLayout.IframeWrapper>
                    <iframe src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${roomId}`} ref={iframe} />
                </IframeLayout.IframeWrapper>
            ) }
        </>
    );
}

RoomId.getLayout = () => {
    return IframeLayout.Layout;
};
