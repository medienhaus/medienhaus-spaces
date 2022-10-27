import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';

import { useAuth } from '../lib/Auth';
import { useMatrix } from '../lib/Matrix';
import MultiColumnLayout from '../components/layouts/multicolumn';

const SidebarColumn = styled(MultiColumnLayout.Column)`
  @media (width > 51em) {
    max-width: 30ch;
  }
`;

const IframeColumn = styled(MultiColumnLayout.Column)`
  max-width: unset;
  padding: 0;

  iframe {
    width: 100%;
    height: 100%;
    margin-bottom: -7px; /* For some reason Element renders a 7px tall invisible object at the bottom */
    border: none;
  }
`;

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
  background: black;
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

const sortRooms = function(room) {
    return [
        room.notificationCount == 0,
        room.name,
    ];
};

const SidebarListEntry = function({ room, onClick }) {
    return (
        <SidebarListEntryWrapper href="#" onClick={onClick}>
            { room.avatar ? (<Avatar src={room.avatar} alt={room.name} />) : (<Avatar />) }
            <RoomName>{ room.name }</RoomName>
            { room.notificationCount > 0 && (
                <UnreadNotificationBadge>{ room.notificationCount }</UnreadNotificationBadge>
            ) }
        </SidebarListEntryWrapper>
    );
};

export default function Chat() {
    const auth = useAuth();
    const iframe = useRef();
    const { t } = useTranslation('chat');
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const [iframeLocation, setIframeLocation] = useState(`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/`);

    // Injecting custom CSS into the Element <iframe>
    useEffect(() => {
        if (!iframe.current) return;

        const injectCss = () => {
            const styleTag = document.createElement('style');
            const styleContent = document.createTextNode(`
                * {
                  border-radius: unset !important;
                }
                .mx_LeftPanel_wrapper { display: none !important }
                .mx_RightPanel_roomSummaryButton, .mx_RightPanel_notifsButton { display: none }
                .mx_RoomHeader_name { pointer-events: none; }
                .mx_RoomHeader_chevron { display: none; }
            `);
            styleTag.appendChild(styleContent);
            iframe.current.getSVGDocument().getElementsByTagName('html')[0].appendChild(styleTag);
        };

        iframe.current.addEventListener('load', injectCss);

        return () => {
            iframe.current && iframe.current.removeEventListener('load', injectCss);
        };
    });

    // @TODO: This check should happen somewhere more globally. If the user is not logged in / if we're still
    // determining if the user is logged in, we don't want to render anything. But this goes for pretty much all
    // existing subpages as well. So this check should be moved somewhere else.
    if (!auth.user) return null;

    const goToRoom = function(roomId) {
        setIframeLocation(`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${roomId}`);
    };

    return (
        <>
            <SidebarColumn>
                <MultiColumnLayout.ColumnMobileHead href="#">/chat</MultiColumnLayout.ColumnMobileHead>
                <h2>/chat</h2>
                <br />
                { matrix.invites.size > 0 && (
                    <>
                        <details open>
                            <summary><h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{ t('Invites') }</h3></summary>
                            { (matrix.invites && _.sortBy([...matrix.invites.values()], sortRooms).map((room) => <SidebarListEntry key={room.roomId} room={room} onClick={() => goToRoom(room.roomId)} />)) }
                        </details>
                        <br />
                    </>
                ) }
                <details open>
                    <summary><h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{ t('People') }</h3></summary>
                    { (matrix.directMessages && _.sortBy([...matrix.directMessages.values()], sortRooms).map((room) => <SidebarListEntry key={room.roomId} room={room} onClick={() => goToRoom(room.roomId)} />)) }
                </details>
                <br />
                <details open>
                    <summary><h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{ t('Rooms') }</h3></summary>
                    { (matrix.rooms && _.sortBy([...matrix.rooms.values()], sortRooms).map((room) => <SidebarListEntry key={room.roomId} room={room} onClick={() => goToRoom(room.roomId)} />)) }
                </details>
                <br />
            </SidebarColumn>
            <IframeColumn>
                <iframe src={iframeLocation} ref={iframe} />
            </IframeColumn>
        </>
    );
}

Chat.getLayout = () => {
    return MultiColumnLayout.Layout;
};
