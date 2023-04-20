import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import Lock from '../../assets/icons/lock.svg';
import { ServiceTable } from '../../components/UI/ServiceTable';

const WriteListEntry = ({ parent, roomId, serverPads, selected }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const [linkName, setLinkName] = useState('');
    const [content, setContent] = useState(matrix.roomContents.get(roomId));
    const { t } = useTranslation('write');

    useEffect(() => {
        let cancelled = false;
        !cancelled && setLinkName(matrix.rooms.get(roomId).name);

        return () => cancelled = true;
    }, [matrix.rooms, roomId]);

    useEffect(() => {
        let cancelled = false;

        !cancelled && setContent(matrix.roomContents.get(roomId));

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
    }, [content, matrix, roomId, serverPads]);

    if (content === undefined || serverPads === null) return null;
    if (content === null) return;

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell selected={selected}><Link disabled href={`/write/${roomId}`}>{ linkName }</Link></ServiceTable.Cell>
            { /* Show a lock icon if this is a password protected pad */ }
            { serverPads[content.body.substring(content.body.lastIndexOf('/') + 1)]?.visibility === 'private' && (
                <ServiceTable.Cell>
                    <span title={t('password protected')}><Lock fill="var(--color-attention)" /></span>
                </ServiceTable.Cell>
            ) }
        </ServiceTable.Row>
    );
};
export default WriteListEntry;
