import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ConfirmCancelButtons from '../../components/UI/ConfirmCancelButtons';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import Form from '../../components/UI/Form';

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
 * Displays one knock (request) for a matrix room/space and gives users the option to accept or decline them.
 *
 * @param {Object} invite — object of the room the user was invited to
 * @param {String} path — name of the Application (i.e. the 'path' variable in the config)
 * @param {String} service — name of the service
 * @param {acceptMatrixInvite} acceptMatrixInvite
 * @param {declineMatrixInvite} declineMatrixInvite
 *
 * @returns {React.ReactNode}
 */
export default function KnockCard({ roomId, roomName, user, userId, acceptMatrixInvite, declineMatrixInvite }) {
    const auth = useAuth();
    const matrix = useMatrix();
    const { t } = useTranslation('dashboard');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [isAcceptingKnock, setIsAcceptingKnock] = useState(false);
    const [isDecliningKnock, setIsDecliningKnock] = useState(false);

    const handleDecline = async (e, roomId) => {
        e.preventDefault();
        setIsDecliningKnock(true);
        setIsDecliningKnock(false);
    };

    const handleAccept = async (e, roomId) => {
        e.preventDefault();
        setIsAcceptingKnock(true);
        const invite = await matrixClient.invite(roomId, userId);
        console.log(invite);
        setIsAcceptingKnock(false);
    };

    return (
        <Form
            onSubmit={(e) => handleAccept(e, roomId)}
            onReset={(e) => handleDecline(e, roomId)}
        >
            <>
                <TextParagraph>
                    <Trans
                        t={t}
                        i18nKey="invitationCard"
                        defaults="<bold>{{user}}</bold> wants to join <bold>{{name}}</bold>."
                        values={{ user: user, name: roomName }}
                        components={{ bold: <strong /> }}
                    />
                </TextParagraph>
                <ConfirmCancelButtons
                    small
                    disabled={isDecliningKnock || isAcceptingKnock}
                    cancelLabel={t('Decline')}
                    confirmLabel={t('Accept')}
                />
            </>

        </Form>
    );
}
