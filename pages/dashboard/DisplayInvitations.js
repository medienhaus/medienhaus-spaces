import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Link from 'next/link';
import styled from 'styled-components';

import ConfirmCancelButtons from '../../components/UI/ConfirmCancelButtons';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

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
 * Displays an invitation for a matrix room/space and gives users the option to accept or decline them.
 *
 * @param {Object} invite — object of the room the user was invited to
 * @param {String} path — name of the Application (i.e. the 'path' variable in the config)
 * @param {String} service — name of the service
 * @param {acceptMatrixInvite} acceptMatrixInvite
 * @param {declineMatrixInvite} declineMatrixInvite
 *
 * @returns {React.Component} — JSX Element representing the invitation
*/

const InvitationCard = styled.form`
  > * + * {
    margin-top: var(--margin);
  }

  /* unset or overwrite ConfirmCancelButton attributes */
  > div {
    width: fit-content;

    button {
      height: var(--line-height);
      padding: calc(var(--margin) * 0.1) calc(var(--margin) * 0.35);
      font-size: 80%;
      border-width: calc(var(--margin) * 0.125);
    }

    button[type='reset'] {
      font-weight: 600;
    }
  }
`;

export default function DisplayInvitations({ invite, path, service, acceptMatrixInvite, declineMatrixInvite }) {
    const { t } = useTranslation('dashboard');
    const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
    const [isDecliningInvite, setIsDecliningInvite] = useState(false);
    const [link, setLink] = useState();
    const [wasHandled, setWasHandled] = useState(false);
    const matrix = useMatrix();
    const MatrixAuthProvider = useAuth().getAuthenticationProvider('matrix');

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

        if (service) {
            await MatrixAuthProvider.addSpaceChild(matrix.serviceSpaces[service], roomId).catch(() => {});
        }

        setLink(forwardingUrl);
        setWasHandled(true);
    };

    if (wasHandled) return <HandledInvitation name={invite.name} link={link} />;

    return (
        <InvitationCard
            onSubmit={(e) => handleAccept(e, invite.roomId)}
            onReset={(e) => handleDecline(e, invite.roomId)}
        >
            <h4>
                { link ?
                    <Link href={link}>{ invite.name }</Link>
                    : invite.name }
            </h4>
            <p>
                <Trans
                    t={t}
                    i18nKey="invitationCard"
                    defaults="<italic>{{name}}</italic> wants to {{service}} with you."
                    values={{ name: invite.inviter?.displayName, service: path }}
                    components={{ italic: <em /> }}
                />
            </p>
            <ConfirmCancelButtons
                disabled={isDecliningInvite || isAcceptingInvite || wasHandled}
                cancelLabel={t('Decline')}
                confirmLabel={t('Accept')}
            />
        </InvitationCard>
    );
}

const HandledInvitation = ({ name, link }) => {
    const { t } = useTranslation('dashboard');

    return (
        <InvitationCard>
            <h4>{ name }</h4>
            { link ? (
                <p>
                    <Trans t={t} i18nKey="invitationCardHandled">
                        You can now view <Link href={link}><strong>{ { name } }</strong></Link>
                    </Trans>
                </p>
            ) : (
                <p>{ t('You’ve declined the invitation.') }</p>
            ) }
        </InvitationCard>
    );
};
