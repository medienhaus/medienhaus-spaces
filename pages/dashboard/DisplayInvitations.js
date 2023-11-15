import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { CheckIcon, CloseIcon } from '@remixicons/react/line';
import styled from 'styled-components';

import { ServiceTable } from '../../components/UI/ServiceTable';
import Icon from '../../components/UI/Icon';
import TextButton from '../../components/UI/TextButton';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import ConfirmCancelButtons from '../../components/UI/ConfirmCancelButtons';

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
 * @returns {React.ReactNode}
*/

const InvitationCard = styled.div`
  > * + * {
    margin-top: var(--margin);
  }
`;

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
        <InvitationCard>
            <h4>
                { link ?
                    <Link href={link}>{ invite.name }</Link>
                    : invite.name }
            </h4>
            { /*<ServiceTable.Cell>*/ }
            { /*    { path }*/ }
            { /*</ServiceTable.Cell>*/ }
            <p title={invite.inviter?.userId}>
                { invite.inviter?.displayName }<em>  invited you to join this   </em>{ path } <em>item</em>
            </p>
            <ConfirmCancelButtons
                onClick={(e) => {handleAccept(e, invite.roomId); }}
                onCancel={(e) => handleDecline(e, invite.roomId)}
                disabled={isDecliningInvite || isAcceptingInvite}
                cancelLabel={t('reject')}
                confirmLabel={t('accept')}
            />

            { /*    <TextButton onClick={(e) => { handleAccept(e, invite.roomId); }} disabled={isDecliningInvite || isAcceptingInvite || wasHandled}>*/ }
            { /*        { isAcceptingInvite ?*/ }
            { /*            <LoadingSpinnerInline />*/ }
            { /*            :*/ }
            { /*            <Icon>*/ }
            { /*                <CheckIcon />*/ }
            { /*            </Icon>*/ }
            { /*        }*/ }
            { /*    </TextButton>*/ }
            { /*</ServiceTable.Cell>*/ }
            { /*<ServiceTable.Cell title={t('decline invitation')}>*/ }
            { /*    <TextButton onClick={(e) => {handleDecline(e, invite.roomId);}} disabled={isDecliningInvite || isAcceptingInvite || wasHandled}>*/ }
            { /*        { isDecliningInvite ?*/ }
            { /*            <LoadingSpinnerInline />*/ }
            { /*            :*/ }
            { /*            <Icon>*/ }
            { /*                <CloseIcon />*/ }
            { /*            </Icon>*/ }
            { /*        }*/ }
            { /*    </TextButton>*/ }
        </InvitationCard>
    );
}
