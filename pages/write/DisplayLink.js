import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import useFetchCms from '../../components/matrixFetchCms';
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
    const [removingLink, setRemovingLink] = useState(false);
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const link = matrix.rooms.get(roomId);
    const { t } = useTranslation('explore');

    let { cms, error, fetching } = useFetchCms(roomId);
    cms = cms[0];

    const copyToClipboard = () => navigator.clipboard.writeText(cms.body);

    const removeLink = async () => {
        setRemovingLink(true);
        await auth.getAuthenticationProvider('matrix').removeSpaceChild(parent, roomId);
        matrix.leaveRoom(roomId);
        setRemovingLink(false);
    };

    if (fetching) return <LoadingSpinner />;
    if (error) return <p>{ t('Something went wrong') }</p>;
    if (!cms) return <p>{ t('This room looks empty') }</p>;

    return (
        <LinkELement>
            <a href={cms.body} target="_blank" rel="noopener noreferrer">{ link.name }</a>
            <div className="group">
                <a onClick={copyToClipboard}><Clipboard fill="var(--color-fg)" /></a>
                <a onClick={removeLink}>{ removingLink ? <LoadingSpinner /> : <Bin fill="var(--color-fg)" /> }</a>
            </div>
        </LinkELement>
    );
};
export default DisplayLinks;
