import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import _ from 'lodash';

import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';
import { useAuth } from '@/lib/Auth';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/UI/shadcn/Card';

/**
 * A React component that represents a card for a knock request in a Matrix room.
 *
 * @param {string} roomId - The ID of the room where the knock request was made.
 * @param {string} roomName - The name of the room where the knock request was made.
 * @param {string} userId - The ID of the user who made the knock request.
 * @param {string} reason
 * @returns {JSX.Element} A form that allows the user to accept or decline the knock request.
 */
export default function KnockCard({ roomId, roomName, userId, reason }) {
    const auth = useAuth();
    const { t } = useTranslation('dashboard');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [isAcceptingKnock, setIsAcceptingKnock] = useState(false);
    const [isDecliningKnock, setIsDecliningKnock] = useState(false);

    const handleDecline = async (e) => {
        e.preventDefault();
        setIsDecliningKnock(true);
        await matrixClient.kick(roomId, userId);
        setIsDecliningKnock(false);
    };

    const handleAccept = async (e) => {
        e.preventDefault();
        setIsAcceptingKnock(true);
        await matrixClient.invite(roomId, userId);
        setIsAcceptingKnock(false);
    };

    return (
        <form onSubmit={handleAccept} onReset={handleDecline}>
            <Card>
                <CardHeader>
                    {/* @NOTE: we are setting font-medium here for this <h3> because of the bold username/roomName components */}
                    <CardTitle className="flex items-center gap-4 font-medium">
                        {/* wrap in span to not apply flex gap */}
                        <span>
                            <Trans
                                t={t}
                                i18nKey="knockCard"
                                defaults="<bold>{{username}}</bold> wants to join <bold>{{roomName}}</bold>."
                                values={{
                                    // Show the display name if possible; otherwise fall back to the "@user:matrix.org"-style ID
                                    username: _.get(matrixClient.getUser(userId), 'displayName', userId),
                                    roomName: roomName,
                                }}
                                components={{ bold: <strong /> }}
                            />
                        </span>
                    </CardTitle>
                </CardHeader>
                {/* Show the message/reasoning that a user might have provided */}
                {reason && (
                    <CardContent>
                        <q>{reason}</q>
                    </CardContent>
                )}
                <CardFooter>
                    <ConfirmCancelButtons
                        small
                        disabled={isDecliningKnock || isAcceptingKnock}
                        cancelLabel={t('Decline')}
                        confirmLabel={t('Accept')}
                    />
                </CardFooter>
            </Card>
        </form>
    );
}
