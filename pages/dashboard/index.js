import React, { useEffect } from 'react';
import _ from 'lodash';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';
import { useImmer } from 'use-immer';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import InvitationCard from './InvitationCard';
import DefaultLayout from '../../components/layouts/default';
import KnockCard from './KnockCard';

export default function Dashboard() {
    const { t } = useTranslation('dashboard');

    const auth = useAuth();
    const matrix = useMatrix();
    const livePendingMatrixInvites = matrix.invites;
    const pendingKnocks = matrix.knockingMembers;
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    // We are going to intentionally store a copy of every invitation in the following array, that we're going to append
    // to only, but never remove any entries. This is in order to keep a list of all handled invitations while looking
    // at this page. Only when leaving the page and returning back to it, we start from scratch.
    const [invitations, setInvitations] = useImmer([]);

    useEffect(() => {
        let cancelled = false;

        const hydrateInvitationMetaEvents = async () => {
            // fetch information about pending invitations
            // i.e. who sent it, what are we being invited to (service, chat)
            Array.from(livePendingMatrixInvites.values()).map(async (invitationOriginal, index) => {
                if (cancelled) return;

                const invitation = { ...invitationOriginal };
                // if the invitation is already in the invitations object, we don't need to do anything
                if (_.some(invitations, (invite) => _.values(invite).includes(invitation.roomId))) return;

                // otherwise we need to fetch the room object to get the inviter and the meta event
                const room = await matrixClient.getRoom(invitation.roomId);

                // store join rule for each invite
                invitation.joinRule = room.getJoinRule();

                // if the room is a direct message, dmInviter will return the user_id, else undefined
                const dmInviter = room.getDMInviter();

                if (dmInviter) {
                    invitation.dm = true;
                    invitation.inviter = matrixClient.getUser(dmInviter);
                } else {
                // https://github.com/cinnyapp/cinny/blob/47f6c44c17dcf2c03e3ce0cbd8fd352069560556/src/app/organisms/invite-list/InviteList.jsx#L63
                    const inviterName = room.getMember(matrixClient.getUserId())?.events?.member?.getSender?.();
                    invitation.inviter = matrixClient.getUser(inviterName);
                }

                if (cancelled) return;

                if (!invitation.meta) {
                    // if there is no meta key yet, we manually check for one
                    const metaEvent = await matrix.hydrateMetaEvent(invitation.roomId)
                        .catch(() => { });
                    invitation.meta = metaEvent;

                    if (metaEvent) {
                        if (invitation.meta.type !== 'context') {
                            invitation.service = getConfig().publicRuntimeConfig.authProviders[invitation.meta.template].path || invitation.meta.template;
                        }
                    }
                }

                setInvitations(draft => {
                    draft[index] = invitation;
                });
            });
        };

        if (livePendingMatrixInvites.size > 0) hydrateInvitationMetaEvents();

        return () => {
            cancelled = true;
        };
    }, [invitations, matrix, matrixClient, setInvitations, livePendingMatrixInvites]);

    // functions which interact with matrix server
    const declineMatrixInvite = async (roomId) => {
        await matrix.leaveRoom(roomId);
    };

    const acceptMatrixInvite = async (roomId, path) => {
        await matrixClient.joinRoom(roomId).catch(() => {
            alert(t('Something went wrong! Please try again.'));
        });

        return `${path}/${roomId}`;
    };

    return (
        <DefaultLayout.LameColumn>
            <h2>/dashboard</h2>

            { !_.isEmpty(invitations) &&
                <>
                    <h3>{ t('Invitations') }</h3>
                    <br />
                    { _.map(invitations, (invite, index) => {
                        return (
                            <div key={invite.roomId}>
                                { index > 0 && <><br /><hr /><br /></> }
                                <InvitationCard
                                    path={invite.meta ? invite.service || '/explore' : '/chat'}
                                    invite={invite}
                                    service={invite.meta?.template}
                                    acceptMatrixInvite={acceptMatrixInvite}
                                    declineMatrixInvite={declineMatrixInvite}
                                />
                            </div>
                        );
                    }) }
                </>
            }

            { pendingKnocks.size > 0 &&
                <>
                    <h3>{ t('Accept Knocks') }</h3>
                    <br />
                    { Array.from(pendingKnocks.values()).map((knock, index) => {
                        return (
                            <div key={knock.roomId}>
                                { index > 0 && <><br /><hr /><br /></> }
                                <KnockCard
                                    roomId={knock.roomId}
                                    roomName={knock.roomName}
                                    user={knock.name}
                                    userId={knock.userId}
                                />
                            </div>
                        );
                    }) }
                </>
            }

        </DefaultLayout.LameColumn>
    );
}
