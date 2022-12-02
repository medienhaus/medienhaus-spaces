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

const sortRooms = function(room) {
    return [
        room.notificationCount == 0,
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

const SidebarListEntry = function({ room, onClick }) {
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
        if (!iframe.current) return;

        const injectCss = () => {
            const styleTag = document.createElement('style');
            const styleContent = document.createTextNode(`
                @media (prefers-color-scheme: dark) {
                    body {
                        color-scheme: dark !important;

                        --accent: #3f3f3f !important;
                        --accent-0pct: #3f3f3f00 !important;
                        --accent-15pct: #3f3f3f26 !important;
                        --accent-50pct: #3f3f3f7F !important;

                        --accent-color: #3f3f3f !important;
                        --accent-color-0pct: #3f3f3f00 !important;
                        --accent-color-15pct: #3f3f3f26 !important;
                        --accent-color-50pct: #3f3f3f7F !important;

                        --icon-button-color: #3f3f3f !important;
                        --icon-button-color-0pct: #3f3f3f00 !important;
                        --icon-button-color-15pct: #3f3f3f26 !important;
                        --icon-button-color-50pct: #3f3f3f7F !important;

                        --primary-color: #f0f0f0 !important;
                        --primary-color-0pct: #f0f0f000 !important;
                        --primary-color-15pct: #f0f0f026 !important;
                        --primary-color-50pct: #f0f0f07F !important;

                        --roomlist-background-color: #0f0f0f !important;
                        --roomlist-background-color-0pct: #0f0f0f00 !important;
                        --roomlist-background-color-15pct: #0f0f0f26 !important;
                        --roomlist-background-color-50pct: #0f0f0f7F !important;

                        --roomlist-highlights-color: #1f1f1f !important;
                        --roomlist-highlights-color-0pct: #1f1f1f00 !important;
                        --roomlist-highlights-color-15pct: #1f1f1f26 !important;
                        --roomlist-highlights-color-50pct: #1f1f1f7F !important;

                        --roomlist-separator-color: #1f1f1f !important;
                        --roomlist-separator-color-0pct: #1f1f1f00 !important;
                        --roomlist-separator-color-15pct: #1f1f1f26 !important;
                        --roomlist-separator-color-50pct: #1f1f1f7F !important;

                        --roomlist-text-color: #f0f0f0 !important;
                        --roomlist-text-color-0pct: #f0f0f000 !important;
                        --roomlist-text-color-15pct: #f0f0f026 !important;
                        --roomlist-text-color-50pct: #f0f0f07F !important;

                        --roomlist-text-secondary-color: #f0f0f0 !important;
                        --roomlist-text-secondary-color-0pct: #f0f0f000 !important;
                        --roomlist-text-secondary-color-15pct: #f0f0f026 !important;
                        --roomlist-text-secondary-color-50pct: #f0f0f07F !important;

                        --sidebar-color: #0f0f0f !important;
                        --sidebar-color-0pct: #0f0f0f00 !important;
                        --sidebar-color-15pct: #0f0f0f26 !important;
                        --sidebar-color-50pct: #0f0f0f7F !important;

                        --timeline-background-color: #0f0f0f !important;
                        --timeline-background-color-0pct: #0f0f0f00 !important;
                        --timeline-background-color-15pct: #0f0f0f26 !important;
                        --timeline-background-color-50pct: #0f0f0f7F !important;

                        --timeline-highlights-color: #1a1f1c !important;
                        --timeline-highlights-color-0pct: #1a1f1c00 !important;
                        --timeline-highlights-color-15pct: #1a1f1c26 !important;
                        --timeline-highlights-color-50pct: #1a1f1c7F !important;

                        --timeline-text-color: #f0f0f0 !important;
                        --timeline-text-color-0pct: #f0f0f000 !important;
                        --timeline-text-color-15pct: #f0f0f026 !important;
                        --timeline-text-color-50pct: #f0f0f07F !important;

                        --timeline-text-secondary-color: #f0f0f0 !important;
                        --timeline-text-secondary-color-0pct: #f0f0f000 !important;
                        --timeline-text-secondary-color-15pct: #f0f0f026 !important;
                        --timeline-text-secondary-color-50pct: #f0f0f07F !important;

                        --warning-color: #ff4b55 !important;
                        --warning-color-0pct: #ff4b5500 !important;
                        --warning-color-15pct: #ff4b5526 !important;
                        --warning-color-50pct: #ff4b557F !important;

                        --avatar-background-colors_0: #1f1f1f !important;
                        --avatar-background-colors_1: #1f1f1f !important;
                        --avatar-background-colors_2: #1f1f1f !important;

                        --username-colors_0: #f0f0f0 !important;
                        --username-colors_1: #f0f0f0 !important;
                        --username-colors_2: #f0f0f0 !important;
                        --username-colors_3: #f0f0f0 !important;
                        --username-colors_4: #f0f0f0 !important;
                        --username-colors_5: #f0f0f0 !important;
                        --username-colors_6: #f0f0f0 !important;
                        --username-colors_7: #f0f0f0 !important;

                        --font-family: "Inter" !important;

                        /* @NOTE: the following variables are found throughout element-web's \`theme-light-custom.css\` (fallback: \`#2e2f32\`) and \`theme-dark-custom.css\` (fallback: \`#edf3ff\`) */
                        --secondary-content: var(--primary-color-50pct) !important;
                        --tertiary-content: var(--primary-color-50pct) !important;
                        --quaternary-content: var(--primary-color-50pct) !important;
                        --quinary-content: var(--primary-color-50pct) !important;
                    }
                }
                * { border-radius: unset !important }
                .mx_LeftPanel_outerWrapper, .mx_LeftPanel_outerWrapper + .mx_ResizeHandle_horizontal { display: none !important }
                .mx_RightPanel_roomSummaryButton, .mx_RightPanel_notifsButton { display: none }
                .mx_RoomHeader_name { pointer-events: none }
                .mx_RoomHeader_chevron { display: none }

                /* @TODO: This can be improved... and should probably not target mobile viewports. It's to make the */
                /* header look like it's on line with our header elements from first & second sidebar. */
                .mx_RoomHeader_wrapper { height: unset; padding: 0; border-bottom: none }
                .mx_RoomHeader { flex: unset; -webkit-box-flex: unset; padding: 2.85rem 0 } 
                .mx_RoomHeader_name { font-weight: bold }
            `);
            styleTag.appendChild(styleContent);
            iframe.current.contentDocument.getElementsByTagName('html')[0].appendChild(styleTag);
        };

        iframe.current.addEventListener('load', injectCss);

        return () => {
            iframe.current && iframe.current.removeEventListener('load', injectCss);
        };
    });

    const invites = _.sortBy([...matrix.invites.values()], sortRooms);
    const directMessages = _.sortBy([...matrix.directMessages.values()], sortRooms);
    // Other rooms contains all rooms, except for the ones that ...
    const otherRooms = _([...matrix.rooms.values()])
        // ... are direct messages,
        .reject(room => matrix.directMessages.has(room.roomId))
        // ... are medienhaus/ CMS related rooms (so if they have a dev.medienhaus.meta event which is NOT "type: chat")
        .reject(room => room.events.get('dev.medienhaus.meta') && room.events.get('dev.medienhaus.meta').values().next().value.getContent()?.type !== 'chat')
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
