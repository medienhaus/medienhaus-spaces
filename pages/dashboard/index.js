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
import DefaultLayout from '../../components/layouts/default';

const TableSection = styled.section`
  overflow-x: auto;
`;

export default function Dashboard() {
    const auth = useAuth();
    const matrix = useMatrix();
    const { t } = useTranslation('dashboard');
    const [serviceInvitations, setServiceInvitations] = useState([]);

    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const serviceSpaces = matrix.serviceSpaces;
    const [chatInvitations, setChatInvitations] = useState([]);
    const [contextInvitations, setContextInvitations] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const hydrateInvitationMetaEvents = async () => {
            const serviceInvitationsArray = [];
            // fetch information about pending invitations
            // i.e. who sent it, what are we being invited to (service, chat)
            const chatInvitationsArray = [];

            const contextInvitationsArray = [];

            const sortAndHydrateInvitations = Array.from(matrix.invites.values()).map(async invitation => {
                const room = await matrixClient.getRoom(invitation.roomId);
                // https://github.com/cinnyapp/cinny/blob/47f6c44c17dcf2c03e3ce0cbd8fd352069560556/src/app/organisms/invite-list/InviteList.jsx#L63
                const inviterName = room.getMember(matrixClient.getUserId())?.events?.member?.getSender?.();
                const inviter = matrixClient.getUser(inviterName);
                invitation.inviter = inviter;

                if (!invitation.meta) {
                    // if there is no meta key yet, we manually check for one
                    const metaEvent = await matrix.hydrateMetaEvent(invitation.roomId)
                        .catch(() => { });
                    invitation.meta = metaEvent;
                }

                if (invitation.meta) {
                    //  if (invitation.meta.type === 'context' && getConfig().publicRuntimeConfig.templates.context.includes(invitation.meta.template)) { // @TODO: needs to be discussed if we want to show all or not
                    if (invitation.meta.type === 'context') {
                        contextInvitationsArray.push(invitation);
                    } else {
                        serviceInvitationsArray.push(invitation);
                    }
                } else {
                    chatInvitationsArray.push(invitation);
                }
            });

            await Promise.all(sortAndHydrateInvitations);

            setServiceInvitations(serviceInvitationsArray);
            setChatInvitations(chatInvitationsArray);
            setContextInvitations(contextInvitationsArray);
        };

        if (!cancelled) hydrateInvitationMetaEvents();

        return () => {
            cancelled = true;
        };
    }, [matrix, matrix.invites, matrixClient]);

    // functions which interact with matrix server
    const declineMatrixInvite = async (roomId) => {
        await matrix.leaveRoom(roomId);
    };

    const acceptMatrixInvite = async (roomId, path) => {
        await matrixClient.joinRoom(roomId)
            .catch(() => {
                return;
            });

        return `${path}/${roomId}`;
    };

    return (
        <DefaultLayout.LameColumn>
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
                                   { contextInvitations && _.map(contextInvitations, (invite) => {
                                       return <DisplayInvitations
                                           key={invite.roomId}
                                           path="/explore"
                                           invite={invite}
                                           acceptMatrixInvite={acceptMatrixInvite}
                                           declineMatrixInvite={declineMatrixInvite}
                                       />;
                                   }) }
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
                                           path="/chat"
                                           invite={invite}
                                           acceptMatrixInvite={acceptMatrixInvite}
                                           declineMatrixInvite={declineMatrixInvite}
                                       />;
                                   }) }
                               </ServiceTable.Body>
                           </ServiceTable>
                       </TableSection>
            }
        </DefaultLayout.LameColumn>
    );
}
