import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

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
  padding: 0.25rem 0.8rem;
  margin-left: 0.5rem;
  color: white;
  text-decoration: none;
  background: red;
  border-radius: 2rem;
`;

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
                :root {
                  /* TODO
                  --accent: #0f0f0f;
                  --accent-color: #0f0f0f;
                  --primary-color: #0f0f0f;
                  --sidebar-color: #ffffff;
                  --warning-color: #ff4b55;
                  --roomlist-background-color: #ffffff;
                  --roomlist-highlights-color: #f0f0f0;
                  --roomlist-separator-color: #f0f0f0;
                  --roomlist-text-color: #0f0f0f;
                  --roomlist-text-secondary-color: #0f0f0f;
                  --timeline-background-color: #ffffff;
                  --timeline-highlights-color: #fff8e3;
                  --timeline-text-color: #0f0f0f;
                  --timeline-text-secondary-color: #0f0f0f;
                  */
                  --avatar-background-color: #0f0f0f;
                  --username-color: #0f0f0f;
                }
                @media (prefers-color-scheme: dark) {
                  :root {
                    /* TODO
                    --accent: #3f3f3f;
                    --accent-color: #3f3f3f;
                    --primary-color: #f0f0f0;
                    --sidebar-color: #0f0f0f;
                    --warning-color: #ff4b55;
                    --roomlist-background-color: #0f0f0f;
                    --roomlist-highlights-color: #1f1f1f;
                    --roomlist-separator-color: #1f1f1f;
                    --roomlist-text-color: #f0f0f0;
                    --roomlist-text-secondary-color: #f0f0f0;
                    --timeline-background-color: #0f0f0f;
                    --timeline-highlights-color: #1a1f1c;
                    --timeline-text-color: #f0f0f0;
                    --timeline-text-secondary-color: #f0f0f0;
                    */
                    --avatar-background-color: #1f1f1f;
                    --username-color: #f0f0f0;
                  }
                }
                .mx_BaseAvatar > .mx_BaseAvatar_initial {
                  background-color: var(--avatar-background-color);
                }
                .mx_BaseAvatar > .mx_BaseAvatar_image {
                  background-color: var(--avatar-background-color);
                  // dirty hack to "remove" the colored image linked via src="" ...
                  content: url("");
                }
                .mx_Username_color1,
                .mx_Username_color2,
                .mx_Username_color3,
                .mx_Username_color4,
                .mx_Username_color5,
                .mx_Username_color6,
                .mx_Username_color7,
                .mx_Username_color8 {
                  color: var(--username-color);
                }
                * {
                  border-radius: unset !important;
                  font-family: "Inter", "Apple Color Emoji", "Twemoji", sans-serif !important;
                }
                .mx_EventTile_content .markdown-body code, .mx_EventTile_content .markdown-body pre {
                  font-family: "Roboto Mono", "Apple Color Emoji", "Twemoji", monospace !important;
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
                        <ul>
                            { (matrix.invites && [...matrix.invites.values()].map((room) => (
                                <li key={room.roomId}>
                                    <a href="#" onClick={() => goToRoom(room.roomId)}>
                                        { room.name }
                                    </a>
                                </li>
                            ))) }
                        </ul>
                    </details>
                ) }
                <details open>
                    <summary><h3 style={{ display: 'inline' }}>directs</h3></summary>
                    <ul>
                        { (matrix.directMessages && [...matrix.directMessages.values()].map((room) => (
                            <li key={room.roomId}>
                                <a href="#" onClick={() => goToRoom(room.roomId)}>
                                    { room.name }
                                    { room.notificationCount > 0 && (
                                        <UnreadNotificationBadge>{ room.notificationCount }</UnreadNotificationBadge>
                                    ) }
                                </a>
                            </li>
                        ))) }
                    </ul>
                </details>
                <details open>
                    <summary><h3 style={{ display: 'inline' }}>rooms</h3></summary>
                    <ul>
                        { (matrix.rooms && [...matrix.rooms.values()].map((room) => (
                            <li key={room.roomId}>
                                <a href="#" onClick={() => goToRoom(room.roomId)}>
                                    { room.name }
                                    { room.notificationCount > 0 && (
                                        <UnreadNotificationBadge>{ room.notificationCount }</UnreadNotificationBadge>
                                    ) }
                                </a>
                            </li>
                        ))) }
                    </ul>
                </details>
            </Sidebar>
            <ElementIframe src={iframeLocation} frameBorder="0" ref={iframe} />
        </Wrapper>
    );
}

Chat.getLayout = () => {
    return Fullscreen;
};
