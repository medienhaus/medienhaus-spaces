import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, DoorClosedIcon } from '@remixicons/react/line';

import Icon from './Icon';
import TextButton from './TextButton';
import LoadingSpinnerInline from './LoadingSpinnerInline';
import { useAuth } from '../../lib/Auth';
import { waitFor } from '../../lib/Utils';
import logger from '../../lib/Logging';

const KnockOnMatrixRoom = ({ roomName, roomId }) => {
    const [isKnocking, setIsKnocking] = useState(false);
    const [wasSuccessful, setWasSuccessful] = useState(false);
    const { t } = useTranslation();
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const requestAccess = async () => {
        setIsKnocking(true);
        const knock = await auth.getAuthenticationProvider('matrix').knockOnRoom(roomId)
            .catch((error) => {
                if (error.data.error === 'You are already invited to this room') {
                    // if the user is already invited, we don't want to show an error message and instead join the room
                    logger.debug('User is already invited to room, accepting invite instead');
                    matrixClient.joinRoom(roomId)
                        .catch((error) => {
                            alert(t('The following error occurred: {{error}}', { error: error.data?.error }));
                        });

                    return;
                }

                logger.error('Failed to knock on room:', error);
                alert(t('The following error occurred: {{error}}', { error: error.data?.error }));
            }).finally(() => {
                setIsKnocking(false);
            });
        if (!knock) return;

        if (knock.room_id) {
            // if call was successful, we want to show the checkmark for a short time so users know their request was sent
            setWasSuccessful(true);
            await waitFor(() => setWasSuccessful(false));
        }
    };

    return (
        <TextButton title={t('Request access to {{name}}', { name: roomName })} onClick={requestAccess}>
            { isKnocking ? <LoadingSpinnerInline />
                : <Icon>
                    { wasSuccessful ? <CheckIcon /> : <DoorClosedIcon /> }
                </Icon>
            }

        </TextButton>
    );
};

export default KnockOnMatrixRoom;
