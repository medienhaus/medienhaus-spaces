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
import DisplayBookmarks from './DisplayBookmarks';

const TableSection = styled.section`
  overflow-x: auto;

  & + section {
    margin-top: calc(var(--margin) * 3 + 2px);
  }
`;

export default function Dashboard() {
    const auth = useAuth();
    const matrix = useMatrix();
    const { t } = useTranslation('dashboard');
    const [serviceInvitations, setServiceInvitations] = useState([]);

    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const serviceSpaces = matrix.serviceSpaces;
    const bookmarks = matrix.spaces.get(matrix.serviceSpaces.bookmarks)?.children;
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
                invitation.inviter = matrixClient.getUser(inviterName);

                if (!invitation.meta) {
                    // if there is no meta key yet, we manually check for one
                    invitation.meta = await matrix.hydrateMetaEvent(invitation.roomId)
                        .catch(() => { });
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
                                       <ServiceTable.Header align="left" width="20%">
                                           { t('App') }
                                       </ServiceTable.Header>
                                       <ServiceTable.Header align="left" width="30%">
                                           { t('Item') }
                                       </ServiceTable.Header>
                                       <ServiceTable.Header align="left" width="30%">
                                           { t('From') }
                                       </ServiceTable.Header>
                                       <ServiceTable.Header align="center" width="10%">
                                           { t('Accept') }
                                       </ServiceTable.Header>
                                       <ServiceTable.Header align="center" width="10%">
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

            { bookmarks &&
                <TableSection>
                    <ServiceTable>
                        <ServiceTable.Caption>
                            { t('Bookmarks') }
                        </ServiceTable.Caption>
                        <ServiceTable.Head>
                            <ServiceTable.Row>
                                <ServiceTable.Header align="left" width="20%">
                                    { t('App') }
                                </ServiceTable.Header>
                                <ServiceTable.Header align="left" width="60%">
                                    { t('Item') }
                                </ServiceTable.Header>
                                <ServiceTable.Header align="center" width="10%">
                                    { t('Copy Link') }
                                </ServiceTable.Header>
                                <ServiceTable.Header align="center" width="10%">
                                    { t('Remove') }
                                </ServiceTable.Header>
                            </ServiceTable.Row>
                        </ServiceTable.Head>
                        <ServiceTable.Body>
                            { bookmarks.map(bookmarkSpace => {
                                const spaceName = matrix.spaces.get(bookmarkSpace)?.name;
                                const pathName = getConfig().publicRuntimeConfig.authProviders[spaceName]?.path;

                                return <DisplayBookmarks
                                    key={bookmarkSpace}
                                    bookmarkSpaceId={bookmarkSpace}
                                    name={pathName || spaceName}
                                />;
                            }) }
                        </ServiceTable.Body>
                    </ServiceTable>

                </TableSection>
            }
        </>
    );
}

