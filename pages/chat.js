import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import { useAuth } from '../lib/Auth';
import { useMatrix } from '../lib/Matrix';
import Fullscreen from '../components/layouts/fullscreen';

const Wrapper = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const Sidebar = styled.div`
  height: 100%;
  padding: var(--margin);
  overflow: auto;
  border-right: 0.2rem solid black;

  @media (min-width: 40em) {
    padding: var(--margin) calc(var(--margin) * 2);
  }

  button {
    width: 100%;

    span {
      padding: 3px 10px;
      color: white;
      background: red;
      border-radius: 100%;
    }
  }
`;

const ElementIframe = styled.iframe`
  width: 100%;
  height: 100%;
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

const RoomName = styled.div`
  display: flex;
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
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const [iframeLocation, setIframeLocation] = useState('//localhost/element/#/room/!JCOcYJOShHTvnLmblZ:dev.medienhaus.udk-berlin.de');

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
        setIframeLocation(`//localhost/element/#/room/${roomId}`);
    };

    return (
        <Wrapper>
            <Sidebar>
                { matrix.invites.size > 0 && (
                    <details open>
                        <summary><h3 style={{ display: 'inline' }}>invites</h3></summary>
                        { (matrix.invites && _.sortBy([...matrix.invites.values()], sortRooms).map((room) => <SidebarListEntry key={room.roomId} room={room} onClick={() => goToRoom(room.roomId)} />)) }
                    </details>
                ) }
                <details open>
                    <summary><h3 style={{ display: 'inline' }}>directs</h3></summary>
                    { (matrix.directMessages && _.sortBy([...matrix.directMessages.values()], sortRooms).map((room) => <SidebarListEntry key={room.roomId} room={room} onClick={() => goToRoom(room.roomId)} />)) }
                </details>
                <details open>
                    <summary><h3 style={{ display: 'inline' }}>rooms</h3></summary>
                    { (matrix.rooms && _.sortBy([...matrix.rooms.values()], sortRooms).map((room) => <SidebarListEntry key={room.roomId} room={room} onClick={() => goToRoom(room.roomId)} />)) }
                </details>
            </Sidebar>
            <ElementIframe src={iframeLocation} frameBorder="0" ref={iframe} />
        </Wrapper>
    );
}

Chat.getLayout = () => {
    return Fullscreen;
};
