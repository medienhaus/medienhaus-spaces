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
 * Displays an invitation for a matrix room/space within a <ServiceTable> component.
 *
 * @param {Object} invite — object of the room the user was invited to
 * @param {String} service — name of the service (i.e. the object key names of the 'authProvider' object in the config)
 * @param {String} path — name of the Application (i.e. the 'path' variable in the config)
 *
 * @callback acceptMatrixInvite - callback function to accept invitations to a matrix room or space
 * @param roomId - matrix roomId
 * @param service - name of the service (parsed to the function)
 *
 * @callback declineMatrixInvite - callback function to decline invitations to a matrix room or space
 * @param roomId - matrix roomId
 *
 * @returns {React.ReactComponent}
*/

const DisplayInvitations = ({ invite, path, service, acceptMatrixInvite, declineMatrixInvite }) => {
    const { t } = useTranslation('dashboard');
    const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
    const [isDecliningInvite, setIsDecliningInvite] = useState(false);
    const router = useRouter();

    const handleDecline = async (e, roomId) => {
        e.preventDefault();
        setIsDecliningInvite(true);
        await declineMatrixInvite(roomId);
        setIsDecliningInvite(false);
    };

    const handleAccept = async (e, roomId) => {
        e.preventDefault();
        setIsAcceptingInvite(true);
        const forwardingUrl = await acceptMatrixInvite(roomId, service);
        setIsAcceptingInvite(false);
        if (forwardingUrl) {
            if (confirm('You’ve successfully accepted the invitation!\n\nWould you like to be redirected to the newly accepted {{name}} item?', { name: path })) {
                router.push(forwardingUrl);
            }
        } else {
            alert(t('Something went wrong! Please try again.'));
        }
    };

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell>
                { path }
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                { invite.name }
            </ServiceTable.Cell>
            <ServiceTable.Cell title={invite.inviter?.userId}>
                { invite.inviter?.displayName }
            </ServiceTable.Cell>
            <>
                <ServiceTable.Cell title={t('accept invitation')}>
                    <TextButton onClick={(e) => { handleAccept(e, invite.roomId); }} disabled={isDecliningInvite || isAcceptingInvite}>
                        { isAcceptingInvite ? <LoadingSpinnerInline /> : <AcceptIcon /> }
                    </TextButton>
                </ServiceTable.Cell>
                <ServiceTable.Cell title={t('decline invitation')}>
                    <TextButton onClick={(e) => {handleDecline(e, invite.roomId);}} disabled={isDecliningInvite || isAcceptingInvite}>
                        { isDecliningInvite ? <LoadingSpinnerInline /> : <CloseIcon /> }
                    </TextButton>
                </ServiceTable.Cell>
            </>

        </ServiceTable.Row>

    );
};
export default DisplayInvitations;
