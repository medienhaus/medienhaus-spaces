import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { CheckIcon, CloseIcon } from '@remixicons/react/line';

import { ServiceTable } from '../../components/UI/ServiceTable';
import TextButton from '../../components/UI/TextButton';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

/**
 * Callback definitions
*/
/**
 * @callback acceptMatrixInvite
 * @param {string} roomId
 * @param {string} path
*/
/**
 * @callback declineMatrixInvite
 * @param {string} roomId
*/

/**
 * Displays an invitation for a matrix room/space within a <ServiceTable> component and gives users the option to accept or decline them.
 *
 * @param {React.ComponentPropsWithoutRef} props
 * @param {Object} props.invite — object of the room the user was invited to
 * @param {String} props.path — name of the Application (i.e. the 'path' variable in the config)
 * @param {acceptMatrixInvite} props.acceptMatrixInvite
 * @param {declineMatrixInvite} props.declineMatrixInvite
 *
 * @returns {React.JSX.Element}
*/
export default function DisplayInvitations({ invite, path, acceptMatrixInvite, declineMatrixInvite }) {
    const { t } = useTranslation('dashboard');
    const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);
    const [isDecliningInvite, setIsDecliningInvite] = useState(false);
    const [link, setLink] = useState();
    const [wasHandled, setWasHandled] = useState(false);

    const handleDecline = async (e, roomId) => {
        e.preventDefault();
        setIsDecliningInvite(true);
        await declineMatrixInvite(roomId);
        setWasHandled(true);
        setIsDecliningInvite(false);
    };

    const handleAccept = async (e, roomId) => {
        e.preventDefault();
        setIsAcceptingInvite(true);
        const forwardingUrl = await acceptMatrixInvite(roomId, path);
        setIsAcceptingInvite(false);

        if (!forwardingUrl) {
            alert(t('Something went wrong! Please try again.'));

            return;
        }

        setLink(forwardingUrl);
        setWasHandled(true);
    };

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell>
                { path }
            </ServiceTable.Cell>
            <ServiceTable.Cell>
                { link ?
                    <Link href={link}>{ invite.name }</Link>
                    : invite.name }
            </ServiceTable.Cell>
            <ServiceTable.Cell title={invite.inviter?.userId}>
                { invite.inviter?.displayName }
            </ServiceTable.Cell>
            <ServiceTable.Cell title={t('accept invitation')}>
                <TextButton onClick={(e) => { handleAccept(e, invite.roomId); }} disabled={isDecliningInvite || isAcceptingInvite || wasHandled}>
                    { isAcceptingInvite ? <LoadingSpinnerInline /> : <CheckIcon width="24" height="24" /> }
                </TextButton>
            </ServiceTable.Cell>
            <ServiceTable.Cell title={t('decline invitation')}>
                <TextButton onClick={(e) => {handleDecline(e, invite.roomId);}} disabled={isDecliningInvite || isAcceptingInvite || wasHandled}>
                    { isDecliningInvite ? <LoadingSpinnerInline /> : <CloseIcon width="24" height="24" /> }
                </TextButton>
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
}
