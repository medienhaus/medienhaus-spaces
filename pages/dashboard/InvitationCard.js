import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Link from 'next/link';
import styled from 'styled-components';

import ConfirmCancelButtons from '../../components/UI/ConfirmCancelButtons';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

const TextParagraph = styled.p`
  margin: var(--margin) 0;
`;

/**
 * Callback definitions
 */
/**
 * @callback acceptMatrixInvite
 * @param {string} roomId
 * @param {string} path
 */
/**
 * @callback declineMatrixInvite
 * @param {string} roomId
 */

/**
 * Displays one invitation for a matrix room/space and gives users the option to accept or decline them.
 *
 * @param {Object} invite — object of the room the user was invited to
 * @param {String} path — name of the Application (i.e. the 'path' variable in the config)
 * @param {String} service — name of the service
 * @param {acceptMatrixInvite} acceptMatrixInvite
 * @param {declineMatrixInvite} declineMatrixInvite
 *
 * @returns {React.ReactNode}
 */
export default function InvitationCard({ invite, path, service, acceptMatrixInvite, declineMatrixInvite }) {
    const auth = useAuth();
    const matrix = useMatrix();
    const { t } = useTranslation('dashboard');

    const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
    const [isDecliningInvite, setIsDecliningInvite] = useState(false);
    const [link, setLink] = useState();
    const [wasHandled, setWasHandled] = useState(false);

    const handleDecline = async (e, roomId) => {
        e.preventDefault();
        setIsDecliningInvite(true);
        await declineMatrixInvite(roomId);
        setWasHandled(true);
        setIsDecliningInvite(false);
    };

    const handleAccept = async (e, roomId) => {
        e.preventDefault();
        setIsAcceptingInvite(true);
        const forwardingUrl = await acceptMatrixInvite(roomId, path);
        setIsAcceptingInvite(false);

        if (!forwardingUrl) {
            alert(t('Something went wrong! Please try again.'));

            return;
        }

        // If this invitation was for a service, e.g. Spacedeck, add the item to the user's "personal" Applications
        // sub-space for the given service.
        if (service) {
            await auth.getAuthenticationProvider('matrix').addSpaceChild(matrix.serviceSpaces[service], roomId).catch(() => {});
        }

        setLink(forwardingUrl);
        setWasHandled(true);
    };

    return (
        <form
            onSubmit={(e) => handleAccept(e, invite.roomId)}
            onReset={(e) => handleDecline(e, invite.roomId)}
        >
            <h4>{ invite.name }</h4>
            { wasHandled ? (
                <TextParagraph>
                    { link ? (
                        // Invitation accepted
                        <Trans t={t} i18nKey="invitationCardHandled">
                            You can now view <Link href={link}><strong>{ invite.name }</strong></Link>.
                        </Trans>
                    ) : (
                        // Invitation rejected
                        t('You’ve declined the invitation.')
                    ) }
                </TextParagraph>
            ) : (
                // Invitation pending
                <>
                    <TextParagraph>
                        <Trans
                            t={t}
                            i18nKey="invitationCard"
                            defaults="<italic>{{name}}</italic> wants to {{service}} with you."
                            values={{ name: invite.inviter?.displayName, service: path }}
                            components={{ italic: <em /> }}
                        />
                    </TextParagraph>
                    <ConfirmCancelButtons
                        small
                        disabled={isDecliningInvite || isAcceptingInvite || wasHandled}
                        cancelLabel={t('Decline')}
                        confirmLabel={t('Accept')}
                    />
                </>
            ) }
        </form>
    );
}
