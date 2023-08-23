import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useRouter } from 'next/router';

import { ServiceTable } from '../../components/UI/ServiceTable';
import TextButton from '../../components/UI/TextButton';
import AcceptIcon from '../../assets/icons/accept.svg';
import CloseIcon from '../../assets/icons/close.svg';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

/**
 * COMPONENT 'ApplicationSection'
 *
 * @TODO
 *
 *
 * @param {String} name — name of the Application
 * @param {String} id — id of the application
*/

const ServicePath = styled.span`
  color: var(--color-disabled);
`;

const InviterName = styled(ServicePath)`
  display: block;
  max-width: 24ch;
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DisplayInvitations = ({ invite, service, name, acceptMatrixInvite, rejectMatrixInvite }) => {
    const { t } = useTranslation('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleReject = async (e, roomId) => {
        setIsLoading(true);
        await rejectMatrixInvite(e, roomId);
        setIsLoading(false);
    };

    const handleAccept = async (e, roomId) => {
        setIsLoading(true);
        await acceptMatrixInvite(e, roomId, service, name);
        setIsLoading(false);
        if (confirm('You‘ve successfully accepted the invitation!\n\nWould you like to be redirected to the newly accepted ' + name + ' item?')) {
            router.push(`${name}/${roomId}`);
        }
    };

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell>
                <ServicePath>{ name }/</ServicePath>{ invite.name }
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                <InviterName>{ invite.inviterName }</InviterName>
            </ServiceTable.Cell>
            { isLoading ?
                <ServiceTable.Cell>
                    <LoadingSpinnerInline />
                </ServiceTable.Cell>
                :
                <>
                    <ServiceTable.Cell title={t('accecpt invitation')} onClick={(e) => { handleAccept(e, invite.roomId); }}>
                        <TextButton><AcceptIcon /></TextButton>
                    </ServiceTable.Cell>
                    <ServiceTable.Cell title={t('reject invitation')} onClick={(e) => {handleReject(e, invite.roomId);}}>
                        <TextButton><CloseIcon /></TextButton>
                    </ServiceTable.Cell>
                </>
            }
        </ServiceTable.Row>

    );
};
export default DisplayInvitations;
