import getConfig from 'next/config';
import React, { useEffect, useState } from 'react';

import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import ChatIframeView from '../chat/ChatIframeView';
import ProjectView from './ProjectView';
import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import DefaultLayout from '../../components/layouts/default';

const ExploreIframeViews = ({ currentTemplate, iframeRoomId, title: parsedTitle }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const etherpad = auth.getAuthenticationProvider('etherpad');

    const [title, setTitle] = useState(parsedTitle);

    const iframeUrl = currentTemplate === 'studentProject' ? iframeRoomId : new URL(matrix.roomContents.get(iframeRoomId)?.body);

    // add auth token to etherpad iframe, so authors of the pad don't have to input the password again
    if (currentTemplate === 'etherpad') {
        iframeUrl.searchParams.set('auth_token', etherpad.getToken());
    }

    useEffect(() => {
        let cancelled = false;

        const fetchRoomName = async () => {
            const nameEvent = await matrixClient.getStateEvent(iframeRoomId, 'm.room.name').catch(() => {});
            setTitle(nameEvent?.name);
        };

        if (!cancelled) fetchRoomName();

        return () => (cancelled = true);
    }, [iframeRoomId, matrixClient, parsedTitle]);

    const CurrentView = () => {
        switch (currentTemplate) {
            case 'studentproject':
                return <ProjectView content={iframeUrl} />;
            case 'etherpad':
                return (
                    <>
                        <ServiceIframeHeader
                            content={matrix.roomContents.get(iframeRoomId)?.body}
                            title={title}
                            removeLink={() => console.log('removing pad from parent')}
                            removingLink={false}
                        />
                        <iframe title="etherpad" src={iframeUrl} />
                    </>
                );
            case 'spacedeck':
                return (
                    <>
                        <ServiceIframeHeader
                            content={matrix.roomContents.get(iframeRoomId)?.body}
                            title={title}
                            removeLink={() => console.log('removing sketch from parent')}
                            removingLink={false}
                        />
                        <iframe title="sketch" src={matrix.roomContents.get(iframeRoomId)?.body} />
                    </>
                );
            case 'link':
                return (
                    <>
                        <ServiceIframeHeader content={matrix.roomContents.get(iframeRoomId)?.body} title={title} removingLink={false}
                        />
                        <iframe title="sketch" src={iframeUrl} />
                    </>
                );
            default:
                return <ChatIframeView title="chat" src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${iframeRoomId}`} />;
        }
    };

    return (
        <DefaultLayout.IframeWrapper>
            <CurrentView />
        </DefaultLayout.IframeWrapper>
    );
};

export default ExploreIframeViews;
