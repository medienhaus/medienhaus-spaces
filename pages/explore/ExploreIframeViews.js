import getConfig from 'next/config';
import React, { useEffect, useState } from 'react';

import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import ChatIframeView from '../chat/ChatIframeView';
import ProjectView from './ProjectView';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

const ExploreIframeViews = ({ currentTemplate, iframeRoomId, title: parsedTitle }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [title, setTitle] = useState(parsedTitle);

    useEffect(() => {
        let cancelled = false;
        const fetchRoomName = async () => {
            const nameEvent = await matrixClient.getStateEvent(
                iframeRoomId,
                'm.room.name',
            ).catch(() => {});
            setTitle(nameEvent?.name);
        };

        if (!cancelled) fetchRoomName();

        return () => cancelled = true;
    }, [iframeRoomId, matrixClient, parsedTitle]);

    return (() => {
        switch (currentTemplate) {
            case 'studentproject':
                return <ProjectView content={iframeRoomId} />;
            case 'write-link':
                return (
                    <>
                        <ServiceIframeHeader
                            content={matrix.roomContents.get(iframeRoomId)?.body}
                            title={title}
                            removeLink={() => console.log('removing pad from parent')}
                            removingLink={false} />
                        <iframe src={matrix.roomContents.get(iframeRoomId)?.body} />
                    </>
                );
            case 'sketch-link':
                return (
                    <>
                        <ServiceIframeHeader
                            content={matrix.roomContents.get(iframeRoomId)?.body}
                            title={title}
                            removeLink={() => console.log('removing sketch from parent')}
                            removingLink={false} />
                        <iframe src={matrix.roomContents.get(iframeRoomId)?.body} />
                    </>
                );
            default:
                return (
                    <>
                        <ServiceIframeHeader
                            content={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${iframeRoomId}`}
                            title={title}
                            removeLink={() => console.log('removing chat from parent')}
                            removingLink={false} />
                        <ChatIframeView src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${iframeRoomId}`} />
                    </>
                );
        }
    })();
};
export default ExploreIframeViews;
