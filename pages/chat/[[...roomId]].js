import React from 'react';
import { styled } from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChatNewIcon } from '@remixicons/react/line';

import { useMatrix } from '../../lib/Matrix';
import DefaultLayout from '../../components/layouts/default';
import TextButton from '../../components/UI/TextButton';
import Icon from '../../components/UI/Icon';
import ChatIframeView from './ChatIframeView';

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
    const router = useRouter();
    const roomId = _.get(router, 'query.roomId.0');
    const { t } = useTranslation('chat');
    const matrix = useMatrix();

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
                <h2>
                    <TextButton onClick={() => { router.push('/chat/new'); }} style={{ float: 'right' }}><Icon><ChatNewIcon /></Icon></TextButton>
                    /chat
                </h2>
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
                    <ChatIframeView
                        src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/${roomId === 'new' ? 'home' : `room/${roomId}`}`}
                    />
                </DefaultLayout.IframeWrapper>
            ) }
        </>
    );
}
