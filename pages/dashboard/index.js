import React from 'react';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ApplicationSection from './ApplicationSection';

export default function Dashboard() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const MatrixAuthProvider = auth.getAuthenticationProvider('matrix');

    const invites = matrix.invites;
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const serviceSpaces = matrix.serviceSpaces;

    // const authProviders = getConfig().publicRuntimeConfig.authProviders; // get the authProvider object from the config
    // const providersWithTemplates = useMemo(() => {
    //     return _.pickBy(authProviders, provider => _.has(provider, 'templates')); // only return authProviders which have a templates key
    // }, [authProviders]);

    // functions which interact with matrix server
    const rejectMatrixInvite = async (e, roomId) => {
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
                            rejectMatrixInvite={rejectMatrixInvite}
                            acceptMatrixInvite={acceptMatrixInvite} />;
                    }) }
                </ServiceTable>
            </ApplicationSegment>
            } */ }
            { _.map(serviceSpaces, (id, service) => {
                return <ApplicationSection
                    key={id}
                    id={id}
                    service={service}
                    invitations={invites}
                    acceptMatrixInvite={acceptMatrixInvite}
                    rejectMatrixInvite={rejectMatrixInvite}
                />;
            }) }

        </>
    );
}

