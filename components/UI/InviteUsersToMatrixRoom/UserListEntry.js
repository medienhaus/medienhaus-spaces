import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserAddIcon } from '@remixicons/react/line';

import { ServiceTable } from '../ServiceTable';
import Icon from '../Icon';
import LoadingSpinnerInline from '../LoadingSpinnerInline';
import TextButton from '../TextButton';

const UserListEntry = ({ user, handleInvite, roomName }) => {
    const [isInviting, setIsInviting] = useState(false);
    const { t } = useTranslation();

    const handleClick = async (e) => {
        e.preventDefault();
        setIsInviting(true);
        await handleInvite(user.user_id, user.display_name);
        setIsInviting(false);
    };

    return <ServiceTable.Row>
        <ServiceTable.Cell>{ user.display_name } ({ user.user_id })</ServiceTable.Cell>
        <ServiceTable.Cell>
            <TextButton
                title={t('invite {{user}} to join {{room}}', { user: user.display_name, room: roomName })}
                onClick={handleClick}
                disabled={isInviting}
            >
                { isInviting ?
                    <LoadingSpinnerInline /> || '✓'
                    :
                    <Icon>
                        <UserAddIcon />
                    </Icon>
                }
            </TextButton>
        </ServiceTable.Cell>

    </ServiceTable.Row>;
};

export default UserListEntry;
