import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Link from 'next/link';
import { styled } from 'styled-components';

import ConfirmCancelButtons from '../../components/UI/ConfirmCancelButtons';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/UI/card';
import { useToast } from '@/components/UI/use-toast';

const InvitationCardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: var(--margin);
`;

const Avatar = styled.img`
  display: block;
  flex-shrink: 0;
  width: 2.5ch;
  height: 2.5ch;
  margin-right: var(--margin);
  overflow: hidden;
  background: var(--color-foreground);
  border-radius: 50%;
`;

/**
 * Displays one invitation for a matrix room/space and gives users the option to accept or decline them.
 *
 * @param {Object} invite — object of the room the user was invited to
 * @param {String} path — name of the Application (i.e. the 'path' variable in the config)
 * @param {String} service — name of the service
 *
 * @returns {React.ReactNode}
 */
export default function InvitationCard({ roomId, roomName, inviterUsername, avatar, isDm, joinRule, path, service }) {
    const { t } = useTranslation('dashboard');

    const auth = useAuth();
    const matrix = useMatrix();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
    const [isDecliningInvite, setIsDecliningInvite] = useState(false);
    const [link, setLink] = useState('');
    const [wasHandled, setWasHandled] = useState(false);
    const { toast } = useToast();

    const handleDecline = async (e) => {
        e.preventDefault();
        setIsDecliningInvite(true);
        await matrixClient.leave(roomId);
        setWasHandled(true);
        setIsDecliningInvite(false);
    };

    const handleAccept = async (e) => {
        e.preventDefault();
        setIsAcceptingInvite(true);

        await matrixClient.joinRoom(roomId).catch(() => {
            toast({
                variant: 'destructive',
                title: 'Uh oh! Something went wrong.',
                description: t('Something went wrong! Please try again.'),
            });
        });

        setIsAcceptingInvite(false);

        // If this invitation was for a service, e.g. Spacedeck, add the item to the user's "personal" Applications
        // sub-space for the given service.
        if (service) {
            await auth.getAuthenticationProvider('matrix').addSpaceChild(matrix.serviceSpaces[service], roomId).catch(() => {});
        }

        setLink(`${path}/${roomId}`);
        setWasHandled(true);
    };

    return (<>
        <form
            onSubmit={handleAccept}
            onReset={handleDecline}
        >
            <Card>
                <CardHeader>
                    <CardTitle>
                        <InvitationCardHeader>
                            <Avatar src={avatar} alt={roomName} />{
                                // Invites for direct messages
                                isDm ? (t('Direct Message')) : (
                                // Application service specific invites (e.g. for Spacedeck, Etherpad, ...)
                                    service ? roomName : (
                                    // All other invitations
                                        <>
                                            { roomName }
                                            { (joinRule === 'private' && (
                                                <>
                                            &nbsp;<em>({ t('private') })</em>
                                                </>
                                            )) }
                                        </>
                                    )
                                )
                            }
                        </InvitationCardHeader>
                    </CardTitle>
                    <CardDescription>
                        { wasHandled ? (
                            link ? (
                                // Invitation accepted
                                <Trans t={t} i18nKey="invitationCardHandled" values={{ roomName: roomName }}>
                                    You can now view <Link href={link}><strong>{ roomName }</strong></Link>.
                                </Trans>
                            ) : (
                                // Invitation rejected
                                t('You’ve declined the invitation.')
                            )
                        ) : (
                            // Invitation pending
                            <Trans
                                t={t}
                                i18nKey="invitationCard"
                                defaults="<bold>{{ username }}</bold> wants to <bold>{{ service }}</bold> with you."
                                values={{ username: inviterUsername, service: path }}
                                components={{ bold: <strong /> }}
                            />
                        ) }
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    { !wasHandled && (
                        <>
                            <br />
                            <ConfirmCancelButtons
                                small
                                disabled={isDecliningInvite || isAcceptingInvite || wasHandled}
                                cancelLabel={t('Decline')}
                                confirmLabel={t('Accept')}
                            />
                        </>
                    ) }
                </CardFooter>
            </Card>
        </form>
    </>
    );
}
