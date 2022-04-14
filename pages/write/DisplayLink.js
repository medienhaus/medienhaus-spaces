import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Clipboard from '../../assets/icons/clipboard.svg';
import Bin from '../../assets/icons/bin.svg';

const LinkELement = styled.div`
    display: flex;
    align-items: center;
    padding-bottom:0.5em;
    justify-content: space-between;

    .group{
      display:inherit;
    }

    svg {
      margin-left: 0.5em;
      cursor: pointer;
    }

    input{
      margin-right:0.5em;
    }
`;

const DisplayLinks = ({ parent, roomId }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const [removingLink, setRemovingLink] = useState(false);
    const [linkName, setLinkName] = useState('');
    const [content, setContent] = useState(matrix.roomContent.get(roomId));
    const { t } = useTranslation('explore');

    const copyToClipboard = () => navigator.clipboard.writeText(content.body);

    const removeLink = async () => {
        setRemovingLink(true);
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(parent, roomId);
        matrix.leaveRoom(roomId);
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
            await matrix.getRoomContent(roomId);
        };
        checkForRoomContent();
    }, [content, matrix, roomId]);

    if (content === undefined) return <LoadingSpinner />;
    if (content === null) return <p>{ t('There is no content in this room') }</p>;

    return (
        <LinkELement>
            <a href={content.body} target="_blank" rel="noopener noreferrer">{ linkName }</a>
            <div className="group">
                <a onClick={copyToClipboard}><Clipboard fill="var(--color-fg)" /></a>
                <a onClick={removeLink}>{ removingLink ? <LoadingSpinner /> : <Bin fill="var(--color-fg)" /> }</a>
            </div>
        </LinkELement>
    );
};
export default DisplayLinks;
