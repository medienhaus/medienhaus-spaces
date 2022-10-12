import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useAuth } from '../lib/Auth';
import { useMatrix } from '../lib/Matrix';

const ElementIframe = styled.iframe`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: calc(100% - 20vh);
  box-shadow: 0 0 0 5px rgb(0 0 0);
  transform-origin: bottom;


  @media (min-width: 29em) {
    position: initial;
    float: right;
    width: 70%;
    height: 90%;
  }
`;

const Sidebar = styled.div`
  @media (min-width: 29em) {
    float: left;
    width: 30%;
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
            iframe.current.removeEventListener('load', injectCss);
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
        <>
            <h1>/chat</h1>
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
                                        <span>{ room.notificationCount }</span>
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
                                        <span>{ room.notificationCount }</span>
                                    ) }
                                </a>
                            </li>
                        ))) }
                    </ul>
                </details>
            </Sidebar>
            <ElementIframe src={iframeLocation} frameBorder="0" ref={iframe} />
        </>
    );
}
