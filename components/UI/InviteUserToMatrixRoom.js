import { useTranslation } from 'react-i18next';

import UserAddIcon from '../../assets/icons/user-add.svg';

export default function InviteUserToMatrixRoom({ roomId }) {
    const { t } = useTranslation();
    const handleClick = () => {

    };

    return <button title={t('Invite another user')} onClick={handleClick}>
        <UserAddIcon fill="var(--color-foreground)" />
    </button>;
}
