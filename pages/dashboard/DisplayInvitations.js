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
 * Displays an invitation for a matrix room/space within a <ServiceTable> component and gives users the option to accept or decline them.
 *
 * @param {React.ComponentPropsWithoutRef} props
 * @param {Object} props.invite — object of the room the user was invited to
 * @param {String} props.path — name of the Application (i.e. the 'path' variable in the config)
 * @param {acceptMatrixInvite} props.acceptMatrixInvite
 * @param {declineMatrixInvite} props.declineMatrixInvite
 *
 * @returns {React.ReactNode}
*/

const InvitationCard = styled.div`
  > * + * {
    margin-top: var(--margin);
  }
`;

export default function DisplayInvitations({ invite, path, service, acceptMatrixInvite, declineMatrixInvite, membership }) {
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
        <InvitationCard>
            <h4>
                { link ?
                    <Link href={link}>{ invite.name }</Link>
                    : invite.name }
            </h4>
            <p>
                <Trans
                    t={t}
                    i18nKey="invitationCard"
                    defaults="<italic>{{name}}</italic> invited you to join this <bold><italic>{{service}}</italic></bold> item"
                    values={{ name: invite.inviter?.displayName, service: path }}
                    components={{ italic: <em />, bold: <strong /> }}
                />

            </p>
            <ConfirmCancelButtons
                onClick={(e) => { handleAccept(e, invite.roomId); }}
                onCancel={(e) => handleDecline(e, invite.roomId)}
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
            <h4>
                { name }
            </h4>
            { link ? <p>
                <Trans
                    t={t}
                    i18nKey="invitationCardHandled"
                >
                    You’ve successfully joined <Link href={link}><strong>{ { name } }</strong></Link></Trans>
            </p>
                : <p> { t('You’ve declined the invitation') } </p>
            }
        </InvitationCard>
    );
};
