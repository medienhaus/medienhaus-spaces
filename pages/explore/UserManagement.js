import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import { ServiceTable } from '../../components/UI/ServiceTable';
import { useAuth } from '../../lib/Auth';
import BinIcon from '../../assets/icons/bin.svg';
import TextButton from '../../components/UI/TextButton';
import ErrorMessage from '../../components/UI/ErrorMessage';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

const UserManagement = ({ roomId, roomName }) => {
    const [errorMessage, setErrorMessage] = useState('');
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(roomId);
    // get the current members of the room and sort them first from highest to lowest power level and then alphabetically
    const currentMembers = _.orderBy(room.getMembers(), ['powerLevel', 'name'], ['desc', 'asc']);
    const selfObject = currentMembers.filter(member => member.userId === matrixClient.getUserId())[0];

    const handleKick = async (userId) => {
        await matrixClient.kick(roomId, userId)
            .catch(error => setErrorMessage(error.data.error));
    };

    return (<>
        <ServiceTable>
            { currentMembers.map(member => {
                // users who once joined the room but left the room already are still listed in the members object
                // therefore we need to filter them
                if (member.membership === 'leave') return null;
                // we don't want to display the currently logged in user
                if (member.userId === selfObject.userId) return null;

                return <UserTableRow
                    key={member.userId}
                    displayName={member.name}
                    userId={member.userId}
                    roomName={roomName}
                    powerLevel={member.powerLevel}
                    selfPowerLevel={selfObject.powerLevel}
                    handleKick={handleKick} />;
            }) }
        </ServiceTable>
        { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
    </>
    );
};
export default UserManagement;

function UserTableRow({ displayName, userId, roomName, powerLevel, selfPowerLevel, handleKick }) {
    const [isKicking, setIsKicking] = useState(false);
    const { t } = useTranslation();

    const onKickClick = async (e) => {
        e.preventDefault();
        setIsKicking(true);
        await handleKick(userId);
        setIsKicking(false);
    };

    return <ServiceTable.Row>
        <ServiceTable.Cell>
            { displayName }
        </ServiceTable.Cell>
        <ServiceTable.Cell>
            <TextButton
                disabled={powerLevel >= selfPowerLevel}
                onClick={onKickClick}
                title={t('Kick {{user}} from {{room}}', { user: displayName, room: roomName })}>
                { isKicking ? <LoadingSpinnerInline /> : <BinIcon fill="var(--color-foreground)" /> }
            </TextButton>
        </ServiceTable.Cell>
    </ServiceTable.Row>;
}

