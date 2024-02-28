import React, { useCallback, useEffect, useState } from 'react';
import { styled } from 'styled-components';
import { useTranslation } from 'react-i18next';
import { RiCheckLine } from '@remixicon/react';

import { useAuth } from '../../../lib/Auth';
import Form from '../../../components/UI/Form';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import { Textarea } from '@/components/UI/shadcn/Textarea';
import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';

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

const ChangeTopic = ({ roomId, roomName }) => {
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const [newTopic, setNewTopic] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentTopic, setCurrentTopic] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useTranslation('explore');

    const getCurrentTopic = useCallback(async () => {
        // Use the Matrix client to get the current room topic
        const stateEvent = await matrixClient.getStateEvent(roomId, 'm.room.topic').catch((error) => {
            // don't show an error if the topic is not set
            if (error.errcode === 'M_NOT_FOUND') return;
            setErrorMessage(error.data?.error);
        });

        if (stateEvent?.topic) {
            setCurrentTopic(stateEvent.topic);
            setNewTopic(stateEvent.topic);
            setErrorMessage('');
        }
    }, [matrixClient, roomId]);

    useEffect(() => {
        // Fetch the current room topic when the component mounts
        getCurrentTopic();
    }, [getCurrentTopic]);

    const handleTopicChange = (e) => {
        console.log(e.target.value);
        setNewTopic(e.target.value);
    };

    const updateTopic = async (e) => {
        e.preventDefault();
        if (!newTopic || isUpdating) return;

        setIsUpdating(true);
        setErrorMessage('');
        // Use the Matrix client to set the new topic for the room
        const sendTopic = await matrixClient.sendStateEvent(roomId, 'm.room.topic', { topic: newTopic }).catch((error) => {
            setErrorMessage(error.data?.error);
        });

        // fetch topic again and set states
        await getCurrentTopic();

        // Reset the input field and update status
        setIsUpdating(false);

        if (sendTopic.event_id) {
            setSuccessMessage('Topic was successfully updated');
            // _.delay(() => onCancel(), 2000);
        }
    };

    return (
        <>
            <Form onSubmit={updateTopic} onReset={() => setNewTopic(currentTopic)}>
                <Textarea
                    placeholder={t('Enter a new topic, for example a short description of ') + roomName}
                    value={newTopic}
                    onChange={handleTopicChange}
                />
                {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
                <ConfirmCancelButtons disabled={isUpdating || currentTopic === newTopic} />
            </Form>
            {successMessage && (
                <p>
                    {t(successMessage)} <RiCheckLine />
                </p>
            )}
        </>
    );
};

export default ChangeTopic;
