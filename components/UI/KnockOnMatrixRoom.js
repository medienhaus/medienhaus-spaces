import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { RiCheckLine, RiDoorClosedLine } from '@remixicon/react';

import Icon from './Icon';
import TextButton from './TextButton';
import LoadingSpinnerInline from './LoadingSpinnerInline';
import { useAuth } from '@/lib/Auth';
import logger from '../../lib/Logging';

const KnockOnMatrixRoom = ({ roomName, roomId }) => {
    const [isKnocking, setIsKnocking] = useState(false);
    const [wasSuccessful, setWasSuccessful] = useState(false);
    const { t } = useTranslation();
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const membership = matrixClient.getRoom(roomId)?.getMyMembership();

    const requestAccess = async () => {
        setIsKnocking(true);

        if (membership === 'invite') {
            // if the user is already invited, want to join the room directly
            logger.debug('User is already invited to room, accepting invite instead');
            matrixClient.joinRoom(roomId).catch((error) => {
                alert(t('The following error occurred: {{error}}', { error: error.data?.error }));
            });
            setIsKnocking(false);

            return;
        }

        const knock = await auth
            .getAuthenticationProvider('matrix')
            .knockOnRoom(roomId)
            .catch((error) => {
                if (error.data.error === 'You are already invited to this room') {
                    // if the user is already invited, we don't want to show an error message and instead join the room
                    // this should not happen anymore with the condition above, but it's better to be safe than sorry
                    logger.debug('User is already invited to room, accepting invite instead');
                    matrixClient.joinRoom(roomId).catch((error) => {
                        alert(t('The following error occurred: {{error}}', { error: error.data?.error }));
                    });

                    return;
                }

                logger.error('Failed to knock on room:', error);
                alert(t('The following error occurred: {{error}}', { error: error.data?.error }));
            })
            .finally(() => {
                setIsKnocking(false);
            });
        if (!knock) return;

        if (knock.room_id) {
            // if call was successful, we want to show the checkmark for a short time so users know their request was sent
            setWasSuccessful(true);
            _.delay(() => setWasSuccessful(false), 2500);
        }
    };

    // if the user is already a member of the room, we don't want to show the button
    if (membership === 'join') return null;

    return (
        <TextButton
            title={t(membership === 'knock' ? 'You have already requested access to {{name}}' : 'Request access to {{name}}', {
                name: roomName,
            })}
            onClick={requestAccess}
            disabled={membership === 'knock'}
        >
            {isKnocking ? <LoadingSpinnerInline /> : <Icon>{wasSuccessful ? <RiCheckLine /> : <RiDoorClosedLine />}</Icon>}
        </TextButton>
    );
};

export default KnockOnMatrixRoom;
