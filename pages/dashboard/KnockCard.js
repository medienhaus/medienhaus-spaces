import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ConfirmCancelButtons from '../../components/UI/ConfirmCancelButtons';
import { useAuth } from '../../lib/Auth';
import Form from '../../components/UI/Form';

const TextParagraph = styled.p`
  margin: var(--margin) 0;
`;

/**
 * A React component that represents a card for a knock request in a Matrix room.
 *
 * @param {string} roomId - The ID of the room where the knock request was made.
 * @param {string} roomName - The name of the room where the knock request was made.
 * @param {string} user - The name of the user who made the knock request.
 * @param {string} userId - The ID of the user who made the knock request.
 * @returns {JSX.Element} A form that allows the user to accept or decline the knock request.
 */
export default function KnockCard({ roomId, roomName, user, userId }) {
    const auth = useAuth();
    const { t } = useTranslation('dashboard');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [isAcceptingKnock, setIsAcceptingKnock] = useState(false);
    const [isDecliningKnock, setIsDecliningKnock] = useState(false);

    const handleDecline = async (e, roomId) => {
        e.preventDefault();
        setIsDecliningKnock(true);
        await matrixClient.kick(roomId, userId);
        setIsDecliningKnock(false);
    };

    const handleAccept = async (e, roomId) => {
        e.preventDefault();
        setIsAcceptingKnock(true);
        await matrixClient.invite(roomId, userId);
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
