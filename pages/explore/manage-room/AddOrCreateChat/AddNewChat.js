import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import { useMatrix } from '@/lib/Matrix';
import logger from '../../../../lib/Logging';
import Form from '../../../../components/UI/Form';
import presets from '../../presets';
import ErrorMessage from '../../../../components/UI/ErrorMessage';
import PreviousNextButtons from '../../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../../components/UI/LoadingSpinnerInline';
import { Input } from '@/components/UI/shadcn/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/shadcn/Select';

export default function AddNewChat({ onPreviousAction, currentId, onSuccess, parentName, updateRoomList }) {
    const matrix = useMatrix();
    const [roomName, setRoomName] = useState('');
    const [roomTopic, setRoomTopic] = useState('');
    const [selectedJoinRule, setSelectedJoinRule] = useState('knock_restricted');
    const [errorMessage, setErrorMessage] = useState('');
    const [userFeedback, setUserFeedback] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation('explore');

    const handleNewChat = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');

        // create new room
        const roomId = await matrix.createRoom(roomName, false, roomTopic, selectedJoinRule, null, null, currentId).catch((error) => {
            setErrorMessage(error.data?.error || t('something went wrong, please try again'));
        });
        // add created room to parent
        const addChildToParent = await matrix
            .addSpaceChild(currentId, roomId)
            .catch((error) => [setErrorMessage(error.data?.error || t('something went wrong, please try again'))]);

        if (addChildToParent.event_id) {
            logger.log('Adding new room to parentId:', currentId);
            setUserFeedback(`${roomName} was successfully created and added to ${parentName}`);
            await updateRoomList(e, currentId);

            _.delay(() => {
                setRoomName('');
                setRoomTopic('');
                setUserFeedback('');
                onSuccess();
            }, 2500);
        }

        setIsLoading(false);
    };

    return (
        <Form onSubmit={handleNewChat}>
            <Input type="text" placeholder={t('name of the room')} value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            <Input type="text" placeholder={t('topic of the room')} value={roomTopic} onChange={(e) => setRoomTopic(e.target.value)} />
            <Select defaultValue={selectedJoinRule} onValueChange={setSelectedJoinRule}>
                <SelectTrigger>
                    <SelectValue placeholder={t('join rule')} />
                </SelectTrigger>
                <SelectContent>
                    {presets.allowedJoinRules.map((joinRule) => {
                        return (
                            <SelectItem key={joinRule.name} value={joinRule.name}>
                                {joinRule.label}
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            {userFeedback && <p>{userFeedback}</p>}
            <PreviousNextButtons
                previousLabel={t('Back')}
                nextLabel={isLoading ? <LoadingSpinnerInline inverted /> : t('Add')}
                disableNext={!roomName || userFeedback}
                onCancel={onPreviousAction}
            />
        </Form>
    );
}
