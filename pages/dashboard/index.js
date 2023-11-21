import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import getConfig from 'next/config';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import DisplayInvitations from './DisplayInvitations';
import DefaultLayout from '../../components/layouts/default';

const CardSection = styled.section`
  overflow-x: auto;

  > * + * {
    margin-top: var(--margin);
  }
`;

export default function Dashboard() {
    const auth = useAuth();
    const matrix = useMatrix();
    const matrixInvites = matrix.invites;

    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [invitations, setInvitations] = useState([]);

    useEffect(() => {
        let cancelled = false;

        const hydrateInvitationMetaEvents = async () => {
            // @TODO invites get updated after accepting or rejecting, invite should move to handled object
            // fetch information about pending invitations
            // i.e. who sent it, what are we being invited to (service, chat)
            // let invitationsObject = Object.assign({}, { ...invitations });
            const updatedInvitations = [...invitations];

            const sortAndHydrateInvitations = Array.from(matrixInvites.values()).map(async invitation => {
                // if the invitation is already in the invitations object, we don't need to do anything
                if (_.some(invitations, (invite) => _.values(invite).includes(invitation.roomId))) return;

                // otherwise we need to fetch the room object to get the inviter and the meta event
                const room = await matrixClient.getRoom(invitation.roomId);
                // https://github.com/cinnyapp/cinny/blob/47f6c44c17dcf2c03e3ce0cbd8fd352069560556/src/app/organisms/invite-list/InviteList.jsx#L63
                const inviterName = room.getMember(matrixClient.getUserId())?.events?.member?.getSender?.();
                invitation.inviter = matrixClient.getUser(inviterName);

                if (!invitation.meta) {
                    // if there is no meta key yet, we manually check for one
                    const metaEvent = await matrix.hydrateMetaEvent(invitation.roomId)
                        .catch(() => { });
                    invitation.meta = metaEvent;

                    if (metaEvent) {
                        if (invitation.meta.type !== 'context') {
                            const path = getConfig().publicRuntimeConfig.authProviders[invitation.meta.template].path || invitation.meta.template;
                            invitation.service = path;
                        }
                    }
                }

                updatedInvitations.push(invitation);
                // invitationsObject = Object.assign({}, invitationsObject, {
                //     [invitation.name]: invitation,
                // });
            });

            await Promise.all(sortAndHydrateInvitations);
            console.log('i fire once');
            if (!cancelled) setInvitations(updatedInvitations);
        };

        console.log('here');
        console.log(matrix);
        console.log(matrixInvites.size);
        if (matrixInvites.size > 0) hydrateInvitationMetaEvents();

        return () => {
            cancelled = true;
        };
        // excluding invitations from dependency array to circumvent endless loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matrixClient, matrixInvites]);

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

            { !_.isEmpty(invitations) > 0 &&
                    <CardSection>
                        { /*<h3>{ t('Invitations') }</h3>*/ }
                        { invitations && _.map(invitations, (invite, index) => {
                            console.log(invite);

                            return <>
                                { index > 0 && <hr /> }
                                <DisplayInvitations
                                    key={invite.roomId}
                                    path={invite.meta ? invite.service || '/explore' : '/chat'}
                                    invite={invite}
                                    service={invite.meta?.template}
                                    acceptMatrixInvite={acceptMatrixInvite}
                                    declineMatrixInvite={declineMatrixInvite}
                                />
                            </>;
                        }) }
                    </CardSection>
            }
        </DefaultLayout.LameColumn>
    );
}
