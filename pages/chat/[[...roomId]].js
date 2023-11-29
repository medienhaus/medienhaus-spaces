import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { useMatrix } from '../../lib/Matrix';
import DefaultLayout from '../../components/layouts/default';
import { breakpoints } from '../../components/_breakpoints';

const sortRooms = function(room) {
    return [
        room.notificationCount === 0,
        room.name,
    ];
};

const UnreadNotificationBadge = styled.div`
  display: grid;
  place-content: center;
  width: 3ch;
  height: var(--line-height);
  color: rgb(255 255 255);
  background-color: var(--color-notification);

  > small {
    font-weight: 600;
  }
`;

const Avatar = styled.img`
  position: relative;
  width: 2rem;
  height: 2rem;
  margin-right: 0.6rem;

  &.placeholder {
    backdrop-filter: invert(100%);
  }
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
                    <Avatar className="placeholder" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
                ) }
                <RoomName>{ room.name }</RoomName>
                { room.notificationCount > 0 && (
                    <UnreadNotificationBadge>
                        <small>
                            { room.notificationCount < 100 ? room.notificationCount : '99+' }
                        </small>
                    </UnreadNotificationBadge>
                ) }
            </SidebarListEntryWrapper>
        </Link>
    );
};

export default function Chat() {
    const iframe = useRef();
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');
    const { t } = useTranslation('chat');
    const matrix = useMatrix();

    // Injecting custom CSS into the Element <iframe>
    useEffect(() => {
        const iframeReference = iframe.current;
        if (!iframeReference) return;

        const injectCss = () => {
            const styleTag = document.createElement('style');
            const styleContent = document.createTextNode(`
                * {
                    --margin: 1rem;

                    --cpd-color-theme-bg: rgb(255 255 255) !important; 
                    --cpd-avatar-bg: #000000 !important;
                    --cpd-avatar-color: #ffffff !important;
                    --cpd-color-text-action-accent: #000 !important;
                    --color-foreground-alpha: rgb(0 0 0 / 5%);

                    border-radius: 4px !important;
                }
                
                @media (prefers-color-scheme: dark) {
                    * {
                        --cpd-color-theme-bg: hsl(0deg 0% 8%) !important;
                        --cpd-avatar-bg: #ffffff !important;
                        --cpd-avatar-color: #000000 !important;
                        --cpd-color-text-action-accent: #fff !important;
                        --color-foreground-alpha: rgb(255 255 255 / 7%);
                    }
                    
                    .mx_AccessibleButton.mx_AccessibleButton_kind_icon_primary, .mx_AccessibleButton.mx_AccessibleButton_kind_primary {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                    }
                }

                /* Hide the left sidebar and that drag-to-resize thingy */
                .mx_LeftPanel_outerWrapper, .mx_LeftPanel_outerWrapper + .mx_ResizeHandle { display: none; !important }
                /* Hides the "Logout" button at the bottom of Element when loading for the first time */
                .mx_MatrixChat_splashButtons { display: none; }
                /* Hide the search bar buttons to only allow searching inside current room */
                .mx_SearchBar_buttons { display: none !important; }
                /* Make the header look like the "header" component we use in other pages */
                .mx_RoomHeader { border-bottom: none; height: unset; padding: calc(var(--margin) * 1.695) calc(var(--margin) * 1.5); }
                .mx_RoomHeader_heading { font-weight: 900; }
                /* Hide avatar of the user we're chatting with */
                .mx_RoomHeader .mx_BaseAvatar { display: none !important; }
                /* Override all of the colorful usernames with the default text color */
                .mx_EventTile .mx_DisambiguatedProfile > span { color: var(--cpd-color-text-primary) !important; }

                @media (max-device-width: 1079px) {
                    .mx_RoomHeader { padding: calc(var(--margin) * 0.75) var(--margin); border-bottom: 1px solid var(--color-foreground-alpha); }
                    
                    /* Make the "right panel" cover the full screen */
                    .mx_RightPanel { position: fixed; left: 0; right: 0; bottom: 0; top: 0; z-index: 999999; }

                    /* More breathing room in the main timeline of a chat */
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_EventTile_line,
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_ThreadSummary,
                    .mx_RoomView_timeline_rr_enabled .mx_EventTile[data-layout=group] .mx_ThreadSummary_icon { margin-right: unset; }
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
    // filtering invites for all invitations without a dev.medienhaus.meta event.
    // for now normal chat rooms don't have this event.
    // why chat rooms don't have a custom state event: https://github.com/medienhaus/medienhaus-spaces/pull/49#discussion_r1310225770
    const invites = _.sortBy([...matrix.invites.values()], sortRooms)
        .filter(invite => !invite.meta);
    const directMessages = _.sortBy([...matrix.directMessages.values()], sortRooms);
    // Other rooms contains all rooms, except for the ones that ...
    const otherRooms = _([...matrix.rooms.values()])
        // ... are direct messages,
        .reject(room => matrix.directMessages.has(room.roomId))
        // @TODO ... contain a dev.medienhaus.meta state event)
        .reject(room => !!room.meta)
        .sortBy(sortRooms)
        .value();

    return (
        <>
            <DefaultLayout.Sidebar>
                <h2>/chat</h2>
                { invites.length > 0 && (
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
            </DefaultLayout.Sidebar>
            { roomId && (
                <DefaultLayout.IframeWrapper>
                    <iframe
                        ref={iframe}
                        title="/chat"
                        src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${roomId}`}
                    />
                </DefaultLayout.IframeWrapper>
            ) }
        </>
    );
}
