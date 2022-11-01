import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import { ServiceLink } from '../../components/UI/StyledComponents';
import FolderClosed from '../../assets/icons/folder-closed.svg';
import FolderOpen from '../../assets/icons/folder-open.svg';
import Bin from '../../assets/icons/bin.svg';
import EditIcon from '../../assets/icons/edit.svg';
import SketchList from './SketchList';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const FolderElement = styled(ServiceLink)`
  span {
    display: flex;
    align-items: center;
  }

  span button {
    width: auto;
  }

  .left {
    margin-left: 0;
  }
`;

const DisplayFolder = ({ roomId, setFolderEdit, setIframe }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const [isFolderExpanded, setIsFolderExpanded] = useState(true);
    const [name, setName] = useState('');
    const [removingFolder, setRemovingFolder] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            const roomName = matrix.spaces.get(roomId).name;
            setName(roomName);
        }
        return () => cancelled = true;
    }, [matrix.spaces, roomId]);

    const deleteFolder = async () => {
        if (confirm(t('Are you sure you want to delete "') + name + '"')) {
            setRemovingFolder(true);
            for (const id of matrix.spaces.get(roomId).children) {
                await auth.getAuthenticationProvider('matrix').removeSpaceChild(roomId, id);
            }

            await matrix.leaveRoom(roomId);
            setRemovingFolder(false);
        }
    };

    return (<>
        <FolderElement
            key={roomId + Math.random()}
            onClick={() => setIsFolderExpanded(prevState => !prevState)}>
            <span>
                <button>{ isFolderExpanded ? <FolderOpen className="left" /> : <FolderClosed className="left" /> }</button>
                { name }
            </span>
            <div className="group">
                <button title={t('Edit Folder')} disabled={removingFolder} onClick={() => setFolderEdit(roomId)}><EditIcon fill="var(--color-fg)" /></button>
                <button title={t('Delete Folder')} disabled={removingFolder} onClick={deleteFolder}>
                    { removingFolder ? <LoadingSpinner /> : <Bin fill="var(--color-fg)" /> }</button>

            </div>
        </FolderElement>
        { isFolderExpanded && <SketchList id={roomId} setIframe={setIframe} indent key={roomId + Math.random()} /> }
    </>
    );
};
export default DisplayFolder;
