import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { ServiceTable } from '../../components/UI/ServiceTable';

export default function SketchLinkEntry({ roomId, selected }) {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const [content, setContent] = useState('');
    const [linkName, setLinkName] = useState('');

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

    if (content === undefined) return <LoadingSpinner />;
    if (content === null) return;

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell selected={selected}>
                <Link disabled href={`/sketch/${roomId}`}>{ linkName }</Link>
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
}
