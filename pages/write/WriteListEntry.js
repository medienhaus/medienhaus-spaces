import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Clipboard from '../../assets/icons/clipboard.svg';
import Bin from '../../assets/icons/bin.svg';
import Lock from '../../assets/icons/lock.svg';
import { ServiceTable } from '../../components/UI/ServiceTable';

const WriteListEntry = ({ parent, roomId, serverPads, callback }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const write = auth.getAuthenticationProvider('write');
    const [removingLink, setRemovingLink] = useState(false);
    const [linkName, setLinkName] = useState('');
    const [content, setContent] = useState(matrix.roomContents.get(roomId));
    const { t } = useTranslation('write');

    const copyToClipboard = () => navigator.clipboard.writeText(content.body);

    const removeLink = async () => {
        setRemovingLink(true);
        const padExistsOnServer = serverPads[content.body.substring(content.body.lastIndexOf('/') + 1)];
        padExistsOnServer && await write.deletePadById(padExistsOnServer._id);
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(parent, roomId);
        await matrix.leaveRoom(roomId);
        await callback();
        setRemovingLink(false);
    };

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
            <ServiceTable.Cell><Link href={`/write/${roomId}`}>{ linkName }</Link></ServiceTable.Cell>
            { serverPads[content.body.substring(content.body.lastIndexOf('/') + 1)]?.visibility === 'private' &&
            <ServiceTable.Cell>
                <button disabled title={t('password protected')}><Lock /></button>
            </ServiceTable.Cell> }
            <ServiceTable.Cell>
                <button title={t('Copy pad link to clipboard')} onClick={copyToClipboard}><Clipboard /></button>
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <button title={t('Remove pad from my library')} onClick={removeLink}>{ removingLink ? <LoadingSpinner /> : <Bin /> }</button>
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
};
export default WriteListEntry;
