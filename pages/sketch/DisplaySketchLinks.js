import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Bin from '../../assets/icons/bin.svg';
import { ServiceLink } from '../../components/UI/StyledComponents';
import CopyToClipboard from '../../components/UI/CopyToClipboard';

const LinkElement = styled(ServiceLink)`
  ${props => props.indent && 'button:first-of-type {  margin-left: 24px}'}
`;

export default function DisplaySketchLinks({ roomId, content: parsedContent, indent }) {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const sketch = auth.getAuthenticationProvider('sketch');
    const { t } = useTranslation('sketch');

    const [content, setContent] = useState(parsedContent);
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
        setContent(parsedContent);
    }, [parsedContent]);

    useEffect(() => {
        const checkForRoomContent = async () => {
            await matrix.hydrateRoomContent(roomId);
        };
        checkForRoomContent();
    }, [content, matrix, roomId]);

    const removeLink = async () => {
        setRemovingLink(true);
        const remove = await sketch.deleteSpaceById(content.substring(content.lastIndexOf('/') + 1));
        console.log(remove);
        // await auth.getAuthenticationProvider('matrix').removeSpaceChild(parent, roomId);
        // await matrix.leaveRoom(roomId);
        setRemovingLink(false);
    };

    if (content === undefined) return <LoadingSpinner />;
    if (content === null) return <p>{ t('There is no content in this room') }</p>;

    return (
        <LinkElement indent={indent}
            key={roomId + Math.random()}
        >
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
