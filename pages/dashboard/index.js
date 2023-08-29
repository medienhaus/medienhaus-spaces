import React from 'react';
import _ from 'lodash';
import getConfig from 'next/config';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ServiceInvitations from './ServiceInvitations';
import { ServiceTable } from '../../components/UI/ServiceTable';
import DisplayInvitations from './DisplayInvitations';

const sortRooms = function(room) {
    return [
        room.notificationCount === 0,
        room.name,
    ];
};

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

    const invites = matrix.invites;
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const serviceSpaces = matrix.serviceSpaces;
    const chatInvitations = _.sortBy([...matrix.invites.values()], sortRooms).filter(invite => !invite.meta);

    // const authProviders = getConfig().publicRuntimeConfig.authProviders; // get the authProvider object from the config
    // const providersWithTemplates = useMemo(() => {
    //     return _.pickBy(authProviders, provider => _.has(provider, 'templates')); // only return authProviders which have a templates key
    // }, [authProviders]);

    // functions which interact with matrix server
    const declineMatrixInvite = async (e, roomId) => {
        e.preventDefault();
        console.log('rejecting ' + roomId);
        await matrix.leaveRoom(roomId);
    };

    const acceptMatrixInvite = async (e, roomId, service, name) => {
        e.preventDefault();
        await matrixClient.joinRoom(roomId).catch(() => {
            return;
        });
        await MatrixAuthProvider.addSpaceChild(serviceSpaces[service], roomId);
    };

    return (
        <>
            <h2>/dashboard</h2>

            { /* { invites.size > 0 && <ApplicationSegment>
                <h2>{ t('Invitations') }</h2>
                <ServiceTable>
                    { _.map([...invites.values()], (invite) => {
                        // if (!serviceTemplates.includes(invite.meta.template)) return null; // only display invitations from the current service
                        return <DisplayInvitations
                            key={invite.roomId}
                            // service={service}
                            invite={invite}
                            declineMatrixInvite={declineMatrixInvite}
                            acceptMatrixInvite={acceptMatrixInvite} />;
                    }) }
                </ServiceTable>
            </ApplicationSegment>
            } */ }
            { invites.size > 0 &&
                       <TableSection>
                           { /* { applicationChildren && <ApplicationSegment>
                <DisplayLatestLinks
                    latestApplicationChildren={applicationChildren.slice(0, 5)}
                    applicationUrlName={name.replace(/[^a-zA-Z0-9 ]/g, '')} />
            </ApplicationSegment> } */ }
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
                                           invitations={invites}
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

