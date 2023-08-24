import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

import { ServiceTable } from '../../components/UI/ServiceTable';
import TextButton from '../../components/UI/TextButton';
import AcceptIcon from '../../assets/icons/accept.svg';
import CloseIcon from '../../assets/icons/close.svg';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

/**
 * COMPONENT 'ApplicationSection'
 *
 * @TODO
 *
 *
 * @param {String} name — name of the Application
 * @param {String} id — id of the application
*/

const DisplayInvitations = ({ invite, service, name, acceptMatrixInvite, declineMatrixInvite }) => {
    const { t } = useTranslation('dashboard');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleDecline = async (e, roomId) => {
        setIsLoading(true);
        await declineMatrixInvite(e, roomId);
        setIsLoading(false);
    };

    const handleAccept = async (e, roomId) => {
        setIsLoading(true);
        await acceptMatrixInvite(e, roomId, service, name);
        setIsLoading(false);
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
            <ServiceTable.Cell>
                { invite.inviterName }
            </ServiceTable.Cell>
            { isLoading ?
                <ServiceTable.Cell>
                    <LoadingSpinnerInline />
                </ServiceTable.Cell>
                :
                <>
                    <ServiceTable.Cell title={t('accept invitation')} onClick={(e) => { handleAccept(e, invite.roomId); }}>
                        <TextButton><AcceptIcon /></TextButton>
                    </ServiceTable.Cell>
                    <ServiceTable.Cell title={t('decline invitation')} onClick={(e) => {handleDecline(e, invite.roomId);}}>
                        <TextButton><CloseIcon /></TextButton>
                    </ServiceTable.Cell>
                </>
            }
        </ServiceTable.Row>

    );
};
export default DisplayInvitations;