import getConfig from 'next/config';
import React, { useEffect, useState } from 'react';
import _ from 'lodash';

import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import ChatIframeView from '../chat/ChatIframeView';
import ProjectView from './ProjectView';
import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import DefaultLayout from '../../components/layouts/default';
import TreePath from './TreePath';

const ExploreIframeViews = ({ currentTemplate, iframeRoomId, title: parsedTitle, selectedSpaceChildren, isFetchingContent }) => {
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
        <DefaultLayout.Wrapper>
            <ServiceIframeHeader content={matrix.roomContents.get(iframeRoomId)?.body} title={title} removingLink={false} />
            <DefaultLayout.ExploreWrapper>
                <DefaultLayout.Sidebar>
                    {!_.isEmpty(selectedSpaceChildren) && (
                        <TreePath
                            selectedSpaceChildren={selectedSpaceChildren}
                            isFetchingContent={isFetchingContent}
                            iframeRoomId={iframeRoomId}
                        />
                    )}
                </DefaultLayout.Sidebar>
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
                        default:
                            return (
                                <ChatIframeView
                                    title={title}
                                    src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${iframeRoomId}`}
                                    roomId={iframeRoomId}
                                />
                            );
                    }
                })()}
            </DefaultLayout.ExploreWrapper>
        </DefaultLayout.Wrapper>
    );
};

export default ExploreIframeViews;
