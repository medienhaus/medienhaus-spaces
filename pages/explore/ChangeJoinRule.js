import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import Form from '../../components/UI/Form';
import presets from './presets';
import ErrorMessage from '../../components/UI/ErrorMessage';

/**
 * JoinRuleChanger component for changing the join rule of a room.
 *
 * @component
 * @param {string} roomId - The ID of the room or space for which the join rule is being changed.
 * @param {string} roomName - The name of the room or space.
 * @returns {JSX.Element} - The rendered component.
 */

const JoinRuleChanger = ({ roomId, roomName }) => {
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const currentJoinRule = matrixClient.getRoom(roomId).getJoinRule();
    const [joinRule, setJoinRule] = useState(currentJoinRule);
    const [changingJoinRule, setChangingJoinRule] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useTranslation('explore');

    const handleChangeJoinRule = async () => {
        setChangingJoinRule(true);
        await matrixClient.sendStateEvent(roomId, 'm.room.join_rules', {}, { join_rule: joinRule })
            .catch((error) => {
                setErrorMessage(error.data?.error);
                setJoinRule(currentJoinRule);
            });
        setChangingJoinRule(false);
    };

    return (
        <Form onSubmit={handleChangeJoinRule}>
            <h1>{ t('Change Join Rule for') } { roomName }</h1>
            <select
                id="joinRule"
                value={joinRule}
                onChange={(e) => setJoinRule(e.target.value)}
            >
                { presets.allowedJoinRules.map((joinRule => {
                    return <option
                        key={joinRule.name}
                        value={joinRule.name}
                        title={joinRule.description}>
                        { joinRule.label }
                    </option>;
                })) }
            </select>
            <button disabled={joinRule === currentJoinRule && changingJoinRule}>Change Join Rule</button>
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </Form>
    );
};

export default JoinRuleChanger;