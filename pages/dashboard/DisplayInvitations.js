import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

import { ServiceTable } from '../../components/UI/ServiceTable';
import TextButton from '../../components/UI/TextButton';
import AcceptIcon from '../../assets/icons/accept.svg';
import CloseIcon from '../../assets/icons/close.svg';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

/**
 * COMPONENT 'DisplayInvitations'
 *
 * @TODO
 *
 *
 * @param {String} name — name of the Application
 * @param {String} id — id of the application
*/

const DisplayInvitations = ({ invite, service, name, acceptMatrixInvite, declineMatrixInvite }) => {
    const { t } = useTranslation('dashboard');
    const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
    const [isDecliningInvite, setisDecliningInvite] = useState(false);
    const router = useRouter();

    const handleDecline = async (e, roomId) => {
        setisDecliningInvite(true);
        await declineMatrixInvite(e, roomId);
        setisDecliningInvite(false);
    };

    const handleAccept = async (e, roomId) => {
        setIsAcceptingInvite(true);
        await acceptMatrixInvite(e, roomId, service, name);
        setIsAcceptingInvite(false);
        if (confirm('You’ve successfully accepted the invitation!\n\nWould you like to be redirected to the newly accepted ' + name + ' item?')) {
            router.push(`${name}/${roomId}`);
        }
    };

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell>
                { name }
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                { invite.name }
            </ServiceTable.Cell>
            <ServiceTable.Cell title={invite.inviter?.userId}>
                { invite.inviter?.displayName }
            </ServiceTable.Cell>
            <>
                <ServiceTable.Cell title={t('accept invitation')} onClick={(e) => { handleAccept(e, invite.roomId); }}>
                    { isAcceptingInvite ? <LoadingSpinnerInline /> : <TextButton><AcceptIcon /></TextButton> }
                </ServiceTable.Cell>
                <ServiceTable.Cell title={t('decline invitation')} onClick={(e) => {handleDecline(e, invite.roomId);}}>
                    { isDecliningInvite ? <LoadingSpinnerInline /> : <TextButton><CloseIcon /></TextButton> }
                </ServiceTable.Cell>
            </>

        </ServiceTable.Row>

    );
};
export default DisplayInvitations;
