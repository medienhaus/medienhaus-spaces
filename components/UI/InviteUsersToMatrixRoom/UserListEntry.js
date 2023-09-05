import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ServiceTable } from '../ServiceTable';
import LoadingSpinnerInline from '../LoadingSpinnerInline';

const UserListEntry = ({ user, handleInvite }) => {
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
            <button type="submit"
                onClick={handleClick}
                disabled={isInviting}
            >{ isInviting ? <LoadingSpinnerInline /> || '✓' : t('Invite') }
            </button>
        </ServiceTable.Cell>

    </ServiceTable.Row>;
};
export default UserListEntry;
