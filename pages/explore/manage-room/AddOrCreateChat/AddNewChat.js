import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { toast } from 'sonner';
import { RiInfoI } from '@remixicon/react';

import { useMatrix } from '@/lib/Matrix';
import logger from '../../../../lib/Logging';
import presets from '@/lib/matrixPresets';
import ErrorMessage from '../../../../components/UI/ErrorMessage';
import PreviousNextButtons from '../../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../../components/UI/LoadingSpinnerInline';
import { Input } from '@/components/UI/shadcn/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/UI/shadcn/Select';
import { Button } from '@/components/UI/shadcn/Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/UI/shadcn/Popover';

/**
 * This component is used to add a new chat room.
 *
 * @param {Function} onPreviousAction - The function to be called when the previous action is triggered.
 * @param {string} currentId - The current ID of the room.
 * @param {Function} onSuccess - The function to be called when the room is successfully created.
 * @param {string} parentName - The name of the parent room.
 * @param {Function} updateRoomList - The function to update the list of rooms.
 *
 * @returns {JSX.Element} - The JSX element representing the add new chat component.
 *
 * @TODO check if rights of users for each chat template are correct.
 * @TODO add dev.medienhaus.meta event to the room when announcement template is selected? Alternatively check if it's possible to see 'preset' was used when creating a matrix room.
 */
export default function AddNewChat({ onPreviousAction, currentId, onSuccess, parentName, updateRoomList }) {
    const matrix = useMatrix();
    const [roomName, setRoomName] = useState('');
    const [roomTopic, setRoomTopic] = useState('');
    const [selectedJoinRule, setSelectedJoinRule] = useState('knock_restricted');
    const [selectedTemplate, setSelectedTemplate] = useState('chat');
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

        // If room was successfully added to parent
        if (addChildToParent.event_id) {
            logger.log('Adding new room to parentId:', currentId);
            await updateRoomList(e, currentId);

            // Reset form fields
            setRoomName('');
            setRoomTopic('');
            setUserFeedback('');
            toast.success(
                t('{{roomName}} was successfully created and added to {{parentName}}', { roomName: roomName, parentName: parentName }),
            );
            onSuccess();
        }

        setIsLoading(false);
    };

    /**
     * Handles the selection of a template and adjusts the join rule accordingly.
     *
     * @param {string} value - The selected template.
     */
    const handleTemplateSelect = (value) => {
        setSelectedTemplate(value);
        setSelectedJoinRule(presets.chatTemplates[value].joinRule || 'public');
    };

    return (
        <form className="[&>*+*]:mt-4" onSubmit={handleNewChat}>
            <Input type="text" placeholder={t('name of the room')} value={roomName} onChange={(e) => setRoomName(e.target.value)} />
            <Input type="text" placeholder={t('topic of the room')} value={roomTopic} onChange={(e) => setRoomTopic(e.target.value)} />
            <div className="flex gap-4">
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                        <SelectValue placeholder={t('join rule')} />
                    </SelectTrigger>
                    <SelectContent>
                        {_.map(presets.chatTemplates, (template, key) => {
                            return (
                                <SelectItem key={key} value={template.name}>
                                    {t(template.label)}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            className="px-2"
                            variant="outline"
                            title={
                                // using title to show the tooltip on desktop
                                t(presets.chatTemplates[selectedTemplate].description)
                            }
                        >
                            <RiInfoI />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        {
                            // using Popover to show the tooltip on mobile
                            t(presets.chatTemplates[selectedTemplate].description)
                        }
                    </PopoverContent>
                </Popover>
            </div>
            <Select value={selectedJoinRule} onValueChange={setSelectedJoinRule}>
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
                className="mt-4"
                previousLabel={t('Back')}
                nextLabel={isLoading ? <LoadingSpinnerInline inverted /> : t('Add')}
                disableNext={!roomName || userFeedback}
                onCancel={onPreviousAction}
            />
        </form>
    );
}
