import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Bin from '../../assets/icons/bin.svg';
import { ServiceLink } from '../../components/UI/ServiceLink';
import CopyToClipboard from '../../components/UI/CopyToClipboard';

const LinkElement = styled(ServiceLink)`
`;

export default function SketchLinkEntry({ roomId, parent }) {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const sketch = auth.getAuthenticationProvider('sketch');
    const { t } = useTranslation('sketch');

    const [content, setContent] = useState('');
    const [linkName, setLinkName] = useState('');
    const [removingLink, setRemovingLink] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            const name = matrix.rooms.get(roomId).name;
            setLinkName(name);
        }
        return () => cancelled = true;
    }, [matrix.rooms, roomId]);

    useEffect(() => {
        let cancelled = false;

        !cancelled && setContent(matrix.roomContents.get(roomId)?.body);

        return () => cancelled = true;
    }, [matrix.roomContents, roomId]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        const checkForRoomContent = async () => {
            await matrix.hydrateRoomContent(roomId, 1, signal);
        };
        checkForRoomContent();

        return () => controller.abort;
    }, [content, matrix, roomId]);

    const removeLink = async () => {
        // @TODO callback function to give user feedback when removing on the server fails
        setRemovingLink(true);
        const remove = await sketch.deleteSpaceById(content.substring(content.lastIndexOf('/') + 1)).catch(() => {});
        if (!remove) {
            setRemovingLink(false);
            return;
        }
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(parent, roomId);
        await matrix.leaveRoom(roomId);
        setRemovingLink(false);
    };

    if (content === undefined) return <LoadingSpinner />;
    if (content === null) return;

    return (
        <LinkElement key={roomId}>
            <Link href={`/sketch/${roomId}`}>{ linkName }</Link>
            <div className="group">
                <>
                    <CopyToClipboard content={content} />
                    <button title={t('Remove pad from my library')} onClick={removeLink}>{ removingLink ? <LoadingSpinner /> : <Bin fill="var(--color-fg)" /> }</button>
                </>
            </div>
        </LinkElement>
    );
}
