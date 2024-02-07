import React from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import getConfig from 'next/config';
import { useRouter } from 'next/router';
import { RiChatNewLine } from '@remixicon/react';

import DefaultLayout from '@/components/layouts/default';
import TextButton from '@/components/UI/TextButton';
import Icon from '@/components/UI/Icon';
import ChatIframeView from './ChatIframeView';
import { ServiceTable } from '@/components/UI/ServiceTable';
import ServiceLink from '@/components/UI/ServiceLink';
import { useMatrix } from '@/lib/Matrix';

const sortRooms = function (room) {
    return [room.notificationCount === 0, room.name];
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
        .reject((room) => matrix.directMessages.has(room.roomId))
        // @TODO ... contain a dev.medienhaus.meta state event)
        .reject((room) => !!room.meta)
        .sortBy(sortRooms)
        .value();

    return (
        <>
            <DefaultLayout.Sidebar>
                <h2>
                    <TextButton
                        onClick={() => {
                            router.push('/chat/new');
                        }}
                        style={{ float: 'right' }}
                    >
                        <Icon>
                            <RiChatNewLine />
                        </Icon>
                    </TextButton>
                    /chat
                </h2>
                <details open>
                    <summary>
                        <h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{t('People')}</h3>
                    </summary>
                    <ServiceTable>
                        <ServiceTable.Body>
                            {directMessages &&
                                directMessages.map((room) => (
                                    <ServiceLink
                                        key={room.roomId}
                                        href={`/chat/${room.roomId}`}
                                        name={room.name}
                                        thumbnail={room.avatar || ' '}
                                        notificationCount={room.notificationCount}
                                        selected={roomId === room.roomId}
                                    />
                                ))}
                        </ServiceTable.Body>
                    </ServiceTable>
                </details>
                <br />
                <details open>
                    <summary>
                        <h3 style={{ display: 'inline-block', marginBottom: '1rem' }}>{t('Rooms')}</h3>
                    </summary>
                    <ServiceTable>
                        <ServiceTable.Body>
                            {otherRooms &&
                                otherRooms.map((room) => (
                                    <ServiceLink
                                        key={room.roomId}
                                        href={`/chat/${room.roomId}`}
                                        name={room.name}
                                        thumbnail={room.avatar || ' '}
                                        notificationCount={room.notificationCount}
                                        selected={roomId === room.roomId}
                                    />
                                ))}
                        </ServiceTable.Body>
                    </ServiceTable>
                </details>
                <br />
            </DefaultLayout.Sidebar>
            {roomId && (
                <DefaultLayout.IframeWrapper>
                    <ChatIframeView
                        roomId={roomId}
                        src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/${roomId === 'new' ? 'home' : `room/${roomId}`}`}
                    />
                </DefaultLayout.IframeWrapper>
            )}
        </>
    );
}
