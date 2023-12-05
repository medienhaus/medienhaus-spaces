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

    const requestAccess = async () => {
        setIsKnocking(true);
        const knock = await auth.getAuthenticationProvider('matrix').knockOnRoom(roomId)
            .catch((error) => {
                logger.error('Failed to knock on room:', error);
                alert(t('The following error occurred: {{error}}', { error: error.message }));
            }).finally(() => {
                setIsKnocking(false);
            });

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
