import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import ErrorMessage from '../../components/UI/ErrorMessage';
import Form from '../../components/UI/Form';
import PreviousNextButtons from '../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '../../components/UI/ServiceTable';

/**
 * A React component for kicking users from a room based on their power level.
 *
 * @component
 * @param {string} roomId - The ID of the room from which to kick users.
 * @param {Function} onCancel - Callback function to cancel the operation.
 * @param {number} powerLevel - The power level of the current user.
 * @returns {JSX.Element} - The rendered component.
 */
const KickUserFromRoom = ({ roomId, onCancel, powerLevel }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = matrix.getMatrixClient();
    const room = matrixClient.getRoom(roomId);
    const members = room.getJoinedMembers();
    // Filter members based on power level
    const filteredMembers = members.filter((member) => {
        // Only include members with lower power levels
        return member.powerLevel < powerLevel;
    });
    const { t } = useTranslation();
    const [isKicking, setIsKicking] = useState(false);
    const [errorMessages, setErrorMessages] = useState(filteredMembers.length === 0 ?[t('No room members available to kick')] : []);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [kickReason, setKickReason] = useState('');

    const handleUserSelection = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter((user) => user !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleKickReasonChange = (event) => {
        setKickReason(event.target.value);
    };

    const handleKickUsers = async (e) => {
        e.preventDefault();
        setIsKicking(true);
        const newErrorMessages = [];

        for (const userId of selectedUsers) {
            await matrixClient.kick(roomId, userId, kickReason)
                .catch(error => {
                    newErrorMessages.push(error.data?.error);
                });
        }
        setErrorMessages((newErrorMessages));
        setIsKicking(false);

        if (newErrorMessages.length === 0) {
        // Once users are kicked successfully, call the onCancel callback
            onCancel();
        }
    };

    return (
        <Form
            onSubmit={handleKickUsers}>
            <ServiceTable>
                <ServiceTable.Caption> <h2>{ t('Select users to kick from the room:') }</h2></ServiceTable.Caption>
                <ServiceTable.Head>
                    { filteredMembers.map((member) => (
                        <ServiceTable.Row key={member.userId}>
                            <ServiceTable.Header align="left"> { member.name }
                            </ServiceTable.Header>
                            <ServiceTable.Header align="right">
                                <input
                                    type="checkbox"
                                    value={member.userId}
                                    checked={selectedUsers.includes(member.userId)}
                                    onChange={() => handleUserSelection(member.userId)}
                                />
                            </ServiceTable.Header>
                        </ServiceTable.Row>
                    )) }
                </ServiceTable.Head>
            </ServiceTable>

            { filteredMembers.length > 0 && <details>
                <summary>{ t('Optional: Reason for kicking') }</summary>
                <input
                    type="text"
                    id="kickReason"
                    value={kickReason}
                    onChange={handleKickReasonChange}
                />
            </details> }

            { errorMessages && errorMessages.map((errorMessage, index) => {
                return <ErrorMessage key={index}>{ errorMessage } </ErrorMessage>;
            }) }

            <PreviousNextButtons onCancel={onCancel}
                disableNext={isKicking || selectedUsers.length === 0}>
                { isKicking ? <LoadingSpinnerInline inverted /> : t('Kick {{amount}} Users', { amount: selectedUsers.length }) }
            </PreviousNextButtons>
        </Form>
    );
};

export default KickUserFromRoom;
