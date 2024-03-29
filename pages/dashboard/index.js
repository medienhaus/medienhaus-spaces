import React, { useEffect } from 'react';
import _ from 'lodash';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';
import { useImmer } from 'use-immer';

import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import DefaultLayout from '@/components/layouts/default';
import { ServiceTable } from '@/components/UI/ServiceTable';
import InvitationCard from './InvitationCard';
import KnockCard from './KnockCard';
import Favourite from './Favourite';

export default function Dashboard() {
    const { t } = useTranslation('dashboard');

    const auth = useAuth();
    const matrix = useMatrix();
    const pendingKnocks = matrix.knockingMembers;
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const favourite = matrix.favourites;
    // We are going to intentionally store a copy of every invitation in this array, which we're going only append to.
    // But we will never remove any entries. This is in order to keep a list of all invitations handled while looking
    // at this page. Only when leaving the page and returning back to it, we start with an empty map from scratch.
    const [invitations, setInvitations] = useImmer(new Map());

    useEffect(() => {
        let cancelled = false;

        // fetch information about pending invitations
        // i.e. who sent it, what are we being invited to (service, chat)
        const hydrateInternalState = async () => {
            for (const roomId of matrix.invites) {
                if (cancelled) continue;

                const room = matrixClient.getRoom(roomId);
                if (!room) continue;

                // If we're displaying this invitation already, we don't need to do anything
                if (invitations.has(roomId)) continue;

                // Make sure we have the meta event ready
                const metaEvent = await matrix.getMetaEvent(roomId);

                // If this is an invitation for a direct message, .getDMInviter() will return the user_id ...
                let inviter = room.getDMInviter();
                // ... otherwise https://github.com/cinnyapp/cinny/blob/47f6c44c17dcf2c03e3ce0cbd8fd352069560556/src/app/organisms/invite-list/InviteList.jsx#L63
                if (!inviter) inviter = room.getMember(matrixClient.getUserId())?.events?.member?.getSender?.();

                // Avatar
                let avatar;

                if (room.getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop')) {
                    avatar = room.getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop');
                } else if (
                    room.getAvatarFallbackMember() &&
                    room.getAvatarFallbackMember().getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop')
                ) {
                    avatar = room.getAvatarFallbackMember().getAvatarUrl(matrixClient.getHomeserverUrl(), 100, 100, 'crop');
                }

                // Service & path
                const service = metaEvent && metaEvent.type !== 'context' && metaEvent.template;
                const path = (() => {
                    if (service) {
                        // This is probably an invitation for an application service (such as Etherpad, Spacedeck, ...)
                        // @TODO: This is nasty... let's see if we can do something like getAuthenticationProvider('service')?.getPath()
                        return getConfig().publicRuntimeConfig.authProviders[service]?.path || `/${service}`;
                    } else if (metaEvent && metaEvent.type === 'context') {
                        // "Contexts" are Matrix space hierarchy elements which we manage via /explore
                        return '/explore';
                    }

                    // ... otherwise /chat is our default fallback
                    return '/chat';
                })();

                setInvitations((map) => {
                    map.set(roomId, {
                        isDm: !!room.getDMInviter(),
                        inviter: matrixClient.getUser(inviter),
                        joinRule: room.getJoinRule(),
                        name: room.name,
                        avatar,
                        service,
                        path,
                        roomId,
                    });
                });
            }
        };

        if (matrix.invites.size > 0) hydrateInternalState();

        return () => {
            cancelled = true;
        };
    }, [matrixClient, matrix, invitations, setInvitations]);

    return (
        <DefaultLayout.LameColumn className="[&>*+*]:mt-8">
            <h2>/dashboard</h2>

            {!_.isEmpty(invitations) && (
                <div>
                    <h3>{t('Invitations')}</h3>
                    <br />
                    {Array.from(invitations.values()).map((invitation, index) => {
                        return (
                            <div key={invitation.roomId}>
                                {index > 0 && <br />}
                                <InvitationCard
                                    path={invitation.path}
                                    roomId={invitation.roomId}
                                    roomName={invitation.name}
                                    inviterUsername={invitation.inviter?.displayName}
                                    isDm={invitation.isDm}
                                    joinRule={invitation.joinRule}
                                    service={invitation.service}
                                    avatar={invitation.avatar}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add some space and a divider between pending invitations and knocks */}
            {invitations.size > 0 && pendingKnocks.size > 0 && (
                <>
                    <br />
                    <br />
                    <br />
                </>
            )}

            {pendingKnocks.size > 0 && (
                <div>
                    <h3>{t('Asking To Join')}</h3>
                    <br />
                    {[...pendingKnocks].map(([key, knock], index) => (
                        <div key={key}>
                            {index > 0 && (
                                <>
                                    <br />
                                    <hr />
                                    <br />
                                </>
                            )}
                            <KnockCard roomId={knock.roomId} roomName={knock.name} userId={knock.userId} reason={knock.reason} />
                        </div>
                    ))}
                </div>
            )}

            {!_.isEmpty(favourite) && (
                <div className="overflow-auto">
                    <ServiceTable>
                        <ServiceTable.Caption>{t('Favourites')}</ServiceTable.Caption>
                        <ServiceTable.Head>
                            <ServiceTable.Row>
                                <ServiceTable.Header align="left" width="20%">
                                    {t('App')}
                                </ServiceTable.Header>
                                <ServiceTable.Header align="left" width="60%">
                                    {t('Item')}
                                </ServiceTable.Header>
                                <ServiceTable.Header align="center" width="10%">
                                    {t('Copy Link')}
                                </ServiceTable.Header>
                                <ServiceTable.Header align="center" width="10%">
                                    {t('Remove')}
                                </ServiceTable.Header>
                            </ServiceTable.Row>
                        </ServiceTable.Head>
                        <ServiceTable.Body>
                            {favourite.map((favouriteSpace) => {
                                const favouriteObject = matrix.rooms.get(favouriteSpace) || matrix.spaces.get(favouriteSpace);

                                if (!favouriteObject) return;

                                return (
                                    <Favourite
                                        key={favouriteSpace}
                                        metaEvent={favouriteObject.meta}
                                        roomId={favouriteSpace}
                                        name={favouriteObject.name}
                                    />
                                );
                            })}
                        </ServiceTable.Body>
                    </ServiceTable>
                </div>
            )}
        </DefaultLayout.LameColumn>
    );
}
