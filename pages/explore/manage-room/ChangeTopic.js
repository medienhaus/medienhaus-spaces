import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { useAuth } from '../../../lib/Auth';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import Form from '../../../components/UI/Form';
import ErrorMessage from '../../../components/UI/ErrorMessage';

const TopicInput = styled.textarea`
  width: 100%;
  padding: 0 calc(var(--margin) * 0.2);
  font-weight: 500;
  color: var(--color-foreground);
  background-color: var(--color-background);
  border-color: var(--color-foreground);
  border-style: solid;
  border-width: calc(var(--margin) * 0.2);
  border-radius: unset;
  appearance: none;
`;

const ChangeTopic = ({ roomId, onCancel }) => {
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const [newTopic, setNewTopic] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentTopic, setCurrentTopic] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Fetch the current room topic when the component mounts
        getCurrentTopic();
    }, [getCurrentTopic]);

    const getCurrentTopic = useCallback(async () => {
        // Use the Matrix client to get the current room topic
        const stateEvent = await matrixClient.getStateEvent(roomId, 'm.room.topic')
            .catch(error => {
                setErrorMessage(error.data?.error);
            });
        if (stateEvent?.topic) {
            setCurrentTopic(stateEvent.topic);
            setNewTopic(stateEvent.topic);
            setErrorMessage('');
        }
    }, [matrixClient, roomId]);

    const handleTopicChange = (e) => {
        setNewTopic(e.target.value);
    };

    const updateTopic = async (e) => {
        e.preventDefault();
        if (!newTopic || isUpdating) return;

        setIsUpdating(true);

        // Use the Matrix client to set the new topic for the room
        const sendTopic = await matrixClient.sendStateEvent(roomId, 'm.room.topic', { topic: newTopic })
            .catch(error => {
                setErrorMessage(error.data?.error);
            });

        // fetch topic again and set states
        await getCurrentTopic();
        // Reset the input field and update status
        setIsUpdating(false);
        if (sendTopic) setErrorMessage('');
    };

    return (
        <Form onSubmit={e => updateTopic(e)}>
            <TopicInput
                type="text"
                rows="5"
                id="topic"
                value={newTopic}
                onChange={handleTopicChange}
                disabled={isUpdating}
            />

            <PreviousNextButtons onCancel={onCancel} disableNext={isUpdating || currentTopic === newTopic} />
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
        </Form>
    );
};

export default ChangeTopic;
