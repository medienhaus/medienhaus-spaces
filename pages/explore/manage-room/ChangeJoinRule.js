import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../lib/Auth';
import Form from '../../../components/UI/Form';
import presets from '../presets';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/shadcn/Select';

/**
 * JoinRuleChanger component for changing the join rule of a room.
 *
 * @component
 * @param {string} roomId - The ID of the room or space for which the join rule is being changed.
 * @param {string} roomName - The name of the room or space.
 * @returns {JSX.Element} - The rendered component.
 */

const JoinRuleChanger = ({ roomId, roomName, onPreviousAction, onCancel }) => {
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const currentJoinRule = matrixClient.getRoom(roomId).getJoinRule();
    const [joinRule, setJoinRule] = useState(currentJoinRule);
    const [changingJoinRule, setChangingJoinRule] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useTranslation('explore');

    const handleChangeJoinRule = async (e) => {
        e.preventDefault();
        setChangingJoinRule(true);
        await matrixClient.sendStateEvent(roomId, 'm.room.join_rules', { join_rule: joinRule }).catch((error) => {
            setErrorMessage(error.data?.error);
            setJoinRule(currentJoinRule);
        });
        setChangingJoinRule(false);
    };

    return (
        <Form onSubmit={handleChangeJoinRule}>
            <h3>
                {t('Change Join Rule for')} {roomName}
            </h3>
            <Select id="joinRule" defaultValue={joinRule} onValueChange={(e) => setJoinRule(e.target.value)}>
                <SelectTrigger>
                    <SelectValue placeholder={t('Join Rule')} />
                </SelectTrigger>
                <SelectContent>
                    {presets.allowedJoinRules.map((joinRule) => {
                        return (
                            <SelectItem key={joinRule.name} value={joinRule.name} title={joinRule.description}>
                                {joinRule.label}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
            <PreviousNextButtons disableNext={joinRule === currentJoinRule || changingJoinRule} onCancel={onPreviousAction}>
                {changingJoinRule ? <LoadingSpinnerInline inverted /> : t('Change Join Rule')}
            </PreviousNextButtons>
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </Form>
    );
};

export default JoinRuleChanger;
