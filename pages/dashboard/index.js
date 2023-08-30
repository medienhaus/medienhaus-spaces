import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import getConfig from 'next/config';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ServiceInvitations from './ServiceInvitations';
import { ServiceTable } from '../../components/UI/ServiceTable';
import DisplayInvitations from './DisplayInvitations';

const TableSection = styled.section`
  overflow-x: auto;

  tbody tr:hover {
    background-color: var(--color-background-alpha);
  }
`;

export default function Dashboard() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const MatrixAuthProvider = auth.getAuthenticationProvider('matrix');
    const { t } = useTranslation('dashboard');
    const [serviceInvitations, setServiceInvitations] = useState([]);

    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const serviceSpaces = matrix.serviceSpaces;
    const [chatInvitations, setChatInvitations] = useState([]);

    useEffect(() => {
        let cancelled = false;
        const hydrateInvitationMetaEvents = async () => {
            const serviceInvitationsArray = [];
            const chatInvitationsArray = [];

            const sortAndHydrateInvitations = Array.from(matrix.invites.values()).map(async invitation => {
                const metaEvent = await matrix.hydrateMetaEvent(invitation.roomId)
                    .catch(() => {});
                const room = matrixClient.getRoom(invitation.roomId);
                const inviterName = room.getMember(matrixClient.getUserId())?.events?.member?.getSender?.();
                const inviter = matrixClient.getUser(inviterName);

                invitation.inviter = inviter;

                if (metaEvent) {
                    invitation.meta = metaEvent;
                    serviceInvitationsArray.push(invitation);
                } else {
                    chatInvitationsArray.push(invitation);
                }
            });

            await Promise.all(sortAndHydrateInvitations);

            setServiceInvitations(serviceInvitationsArray);
            setChatInvitations(chatInvitationsArray);
        };

        if (!cancelled) hydrateInvitationMetaEvents();

        return () => {
            cancelled = true;
        };
    }, [matrix, matrix.invites, matrixClient]);

    // functions which interact with matrix server
    const declineMatrixInvite = async (e, roomId) => {
        e.preventDefault();
        console.log('rejecting ' + roomId);
        await matrix.leaveRoom(roomId);
    };

    const acceptMatrixInvite = async (e, roomId, service) => {
        e.preventDefault();
        await matrixClient.joinRoom(roomId).catch(() => {
            return;
        });
        // if an invation for a chat room was accepeted we don't need to add it to a space and return out of the function
        if (service === 'chat') return;
        await MatrixAuthProvider.addSpaceChild(serviceSpaces[service], roomId);
    };

    return (
        <>
            <h2>/dashboard</h2>

            { matrix.invites.size > 0 &&
                       <TableSection>
                           <ServiceTable>
                               <ServiceTable.Caption>
                                   { t('Invitations') }
                               </ServiceTable.Caption>
                               <ServiceTable.Head>
                                   <ServiceTable.Row>
                                       <ServiceTable.Header align="left">
                                           { t('App') }
                                       </ServiceTable.Header>
                                       <ServiceTable.Header align="left">
                                           { t('Item') }
                                       </ServiceTable.Header>
                                       <ServiceTable.Header align="left">
                                           { t('From') }
                                       </ServiceTable.Header>
                                       <ServiceTable.Header align="center">
                                           { t('Accept') }
                                       </ServiceTable.Header>
                                       <ServiceTable.Header align="center">
                                           { t('Decline') }
                                       </ServiceTable.Header>
                                   </ServiceTable.Row>
                               </ServiceTable.Head>
                               <ServiceTable.Body>
                                   { _.map(serviceSpaces, (id, service) => {
                                       if (!getConfig().publicRuntimeConfig.authProviders[service]) return null; // don't return anything if the service is not in our config.

                                       return <ServiceInvitations
                                           key={id}
                                           id={id}
                                           service={service}
                                           invitations={serviceInvitations}
                                           acceptMatrixInvite={acceptMatrixInvite}
                                           declineMatrixInvite={declineMatrixInvite}
                                       />;
                                   })
                                   }
                                   { chatInvitations && _.map(chatInvitations, (invite) => {
                                       return <DisplayInvitations
                                           key={invite.roomId}
                                           name="/chat"
                                           invite={invite}
                                           declineMatrixInvite={declineMatrixInvite}
                                           acceptMatrixInvite={acceptMatrixInvite} />;
                                   }) }
                               </ServiceTable.Body>
                           </ServiceTable>
                       </TableSection>
            }
        </>
    );
}

