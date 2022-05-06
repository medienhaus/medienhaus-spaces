import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Clipboard from '../../assets/icons/clipboard.svg';
import Bin from '../../assets/icons/bin.svg';
import Lock from '../../assets/icons/lock.svg';

const LinkElement = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;

    .group{
      display:inherit;
    }

    svg {
      margin-left: 0.5em;
      cursor: pointer;
    }

    button{
        background: none;
        border: none;
        padding: 0;
        margin: 0;
    }

    button svg{
        fill: var(--color-fg);
    }
    
    button[disabled] svg{
        fill: var(--color-me);
        cursor: initial;
    }

    ul {
    list-style: none;
    margin-bottom: calc(var(--margin) * 3);
    }

    li {
      margin-bottom: 0.55rem;
}

`;

const WriteListEntry = ({ parent, roomId, serverPads, callback }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const write = auth.getAuthenticationProvider('write');
    const [removingLink, setRemovingLink] = useState(false);
    const [linkName, setLinkName] = useState('');
    const [content, setContent] = useState(matrix.roomContent.get(roomId));
    const [padExistsOnServer, setPadExistsOnServer] = useState(null);
    const { t } = useTranslation('write');

    const copyToClipboard = () => navigator.clipboard.writeText(content.body);

    const removeLink = async () => {
        setRemovingLink(true);
        padExistsOnServer && await write.deletePadById(padExistsOnServer._id);
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(parent, roomId);
        await matrix.leaveRoom(roomId);
        await callback();
        setRemovingLink(false);
    };

    useEffect(() => {
        setLinkName(matrix.rooms.get(roomId).name);
    }, [matrix.rooms, roomId]);

    useEffect(() => {
        setContent(matrix.roomContent.get(roomId));
    }, [matrix.roomContent, roomId]);

    useEffect(() => {
        const checkForRoomContent = async () => {
            await matrix.hydrateRoomContent(roomId);
        };
        checkForRoomContent();
        serverPads && setPadExistsOnServer(serverPads[content.body.substring(content.body.lastIndexOf('/') + 1)]);
    }, [content, matrix, roomId, serverPads]);

    if (content === undefined || serverPads === null) return <LoadingSpinner />;
    if (content === null) return <p>{ t('There is no content in this room') }</p>;

    return (
        <LinkElement>
            <a href={content.body} target="_blank" rel="noopener noreferrer">{ linkName }</a>
            <div className="group">
                <button disabled title={t('password protected')}>{ padExistsOnServer?.visibility === 'private' && <Lock /> }</button>
                <button title={t('Copy pad link to clipboard')} onClick={copyToClipboard}><Clipboard /></button>
                <button title={t('Remove pad from my library')} onClick={removeLink}>{ removingLink ? <LoadingSpinner /> : <Bin /> }</button>
            </div>
        </LinkElement>
    );
};
export default WriteListEntry;
