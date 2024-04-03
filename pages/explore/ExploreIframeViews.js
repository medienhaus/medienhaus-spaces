import getConfig from 'next/config';
import React, { useEffect, useState } from 'react';

import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import ChatIframeView from '../chat/ChatIframeView';
import ProjectView from './ProjectView';
import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import DefaultLayout from '../../components/layouts/default';
import IframeSidebar from './IframeSidebar';

const ExploreIframeViews = ({
    currentTemplate,
    iframeRoomId,
    title: parsedTitle,
    breadcrumbs,
    selectedSpaceChildren,
    allChatRooms,
    getSpaceChildren,
}) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const etherpad = auth.getAuthenticationProvider('etherpad');

    const [title, setTitle] = useState(parsedTitle);

    const iframeUrl = currentTemplate ? new URL(matrix.roomContents.get(iframeRoomId)?.body) : iframeRoomId;

    // add auth token to etherpad iframe, so authors of the pad don't have to input the password again
    if (currentTemplate === 'etherpad') {
        iframeUrl.searchParams.set('auth_token', etherpad.getToken());
    }

    useEffect(() => {
        let cancelled = false;

        const fetchRoomName = async () => {
            if (parsedTitle) setTitle(parsedTitle);
            else {
                const nameEvent = await matrixClient.getStateEvent(iframeRoomId, 'm.room.name').catch(() => {});
                setTitle(nameEvent?.name);
            }
        };

        if (!cancelled) fetchRoomName();

        return () => (cancelled = true);
    }, [iframeRoomId, matrixClient, parsedTitle]);

    return (
        <>
            {currentTemplate && (
                <>
                    <DefaultLayout.Sidebar>
                        {iframeRoomId && (
                            <IframeSidebar
                                breadcrumbs={breadcrumbs}
                                selectedSpaceChildren={selectedSpaceChildren}
                                allChatRooms={allChatRooms}
                                getSpaceChildren={getSpaceChildren}
                            />
                        )}
                    </DefaultLayout.Sidebar>
                    <DefaultLayout.IframeWrapper>
                        <ServiceIframeHeader content={matrix.roomContents.get(iframeRoomId)?.body} title={title} removingLink={false} />

                        {(() => {
                            switch (currentTemplate) {
                                case 'studentproject':
                                    return <ProjectView content={iframeUrl} />;
                                case 'etherpad':
                                    return (
                                        <>
                                            <iframe title="etherpad" src={iframeUrl} />
                                        </>
                                    );
                                case 'spacedeck':
                                    return (
                                        <>
                                            <iframe title="sketch" src={matrix.roomContents.get(iframeRoomId)?.body} />
                                        </>
                                    );
                                case 'link':
                                    return (
                                        <>
                                            <iframe title="sketch" src={iframeUrl} />
                                        </>
                                    );
                            }
                        })()}
                    </DefaultLayout.IframeWrapper>
                </>
            )}
            {!currentTemplate && (
                <ChatIframeView
                    breadcrumbs={breadcrumbs}
                    title={title}
                    src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${iframeRoomId}`}
                    roomId={iframeRoomId}
                    selectedSpaceChildren={selectedSpaceChildren}
                />
            )}
        </>
    );
};

export default ExploreIframeViews;
