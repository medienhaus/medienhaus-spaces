import React, { useState } from 'react';
import { styled } from 'styled-components';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/lib/Auth';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import CreateContext from './CreateContext';
import AddExistingContext from './AddExistingContext';
import AddExistingItem from './AddExistingItem';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import RemoveSpaceFromParent from './RemoveSpaceFromParent';
import UserManagement from './UserManagement';
import LeaveRoom from './LeaveRoom';
import { useMatrix } from '@/lib/Matrix';
import ChangeTopic from './ChangeTopic';
import CreateChatOptions from './AddOrCreateChat';
import ChangeAvatar from './ChangeAvatar';
import { RadioGroup, RadioGroupItem } from '@/components/UI/shadcn/Radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/shadcn/Tabs';
import ChangeJoinRule from './ChangeJoinRule';

/**
 * This component provides actions for managing contexts and items within a matrix room.
 *
 * @param {String} currentId - The ID of the current room.
 * @param {String} parentId - The ID of the parent of the currently observed room.
 * @param {Number} myPowerLevel - Number between 0 and 100.
 * @callback getSpaceChildren - A callback function.
 * @returns {JSX.Element} - The rendered component.
 */

const ExploreMatrixActionWrapper = styled.div`
    width: 100%;
    max-height: 100%;
    overflow-y: auto;
    border-collapse: collapse;

    > * + * {
        margin-top: var(--margin);
    }
`;

const ExploreMatrixActions = ({ currentId, parentId, myPowerLevel, setManageContextActionToggle, spaceChildren, getSpaceChildren }) => {
    const { t } = useTranslation('explore');
    const matrix = useMatrix();
    const roomName = matrix.spaces.get(currentId)?.name || matrix.rooms.get(currentId)?.name;
    if (!roomName) return <LoadingSpinner />;

    return (
        <ExploreMatrixActionWrapper>
            <h2>
                {t('Manage contexts and items within ')}
                {roomName}
            </h2>

            {myPowerLevel && (
                <RenderSwitch
                    currentId={currentId}
                    parentId={parentId}
                    roomName={roomName}
                    setManageContextActionToggle={setManageContextActionToggle}
                    spaceChildren={spaceChildren}
                    getSpaceChildren={getSpaceChildren}
                    myPowerLevel={myPowerLevel}
                />
            )}
        </ExploreMatrixActionWrapper>
    );
};

export default ExploreMatrixActions;

const RenderSwitch = ({ currentId, parentId, roomName, setManageContextActionToggle, spaceChildren, getSpaceChildren, myPowerLevel }) => {
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedRadioButton, setSelectedRadioButton] = useState('');
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(currentId);

    const { t } = useTranslation();

    const onPreviousAction = () => {
        setSelectedRadioButton('');
        setSelectedAction('');
    };

    switch (selectedAction) {
        case 'substructure':
            return (
                <CreateContext
                    currentId={currentId}
                    parentId={parentId}
                    getSpaceChildren={getSpaceChildren}
                    onPreviousAction={onPreviousAction}
                    onCancel={() => setManageContextActionToggle(false)}
                />
            );
        case 'existingItem':
            return (
                <AddExistingItem
                    currentId={currentId}
                    currentName={roomName}
                    onPreviousAction={onPreviousAction}
                    onCancel={() => setManageContextActionToggle(false)}
                />
            );
        case 'existingContext':
            return (
                <AddExistingContext
                    parentId={currentId}
                    parentName={roomName}
                    contextRootId={getConfig().publicRuntimeConfig.contextRootSpaceRoomId}
                    onPreviousAction={onPreviousAction}
                    onCancel={() => setManageContextActionToggle(false)}
                />
            );
        case 'addOrCreateChat':
            return (
                <CreateChatOptions
                    currentId={currentId}
                    parentName={roomName}
                    getSpaceChildren={getSpaceChildren}
                    onPreviousAction={onPreviousAction}
                    onCancel={() => setManageContextActionToggle(false)}
                />
            );
        case 'removeSpace':
            return (
                <RemoveSpaceFromParent
                    currentId={currentId}
                    parentId={currentId}
                    parentName={roomName}
                    spaceChildren={spaceChildren}
                    getSpaceChildren={getSpaceChildren}
                    onPreviousAction={onPreviousAction}
                    onCancel={() => setManageContextActionToggle(false)}
                />
            );
        case 'manageUsers':
            return (
                <UserManagement
                    roomId={currentId}
                    roomName={roomName}
                    onPreviousAction={onPreviousAction}
                    onCancel={() => setManageContextActionToggle(false)}
                />
            );
        case 'leaveRoom':
            return (
                <LeaveRoom
                    roomId={currentId}
                    roomName={roomName}
                    parentId={parentId}
                    onPreviousAction={onPreviousAction}
                    onCancel={() => setManageContextActionToggle(false)}
                />
            );

        case 'changeTopic':
            return (
                <ChangeTopic roomId={currentId} onPreviousAction={onPreviousAction} onCancel={() => setManageContextActionToggle(false)} />
            );

        case 'changeAvatar':
            return (
                <ChangeAvatar roomId={currentId} onPreviousAction={onPreviousAction} onCancel={() => setManageContextActionToggle(false)} />
            );
        default:
            return (
                <Tabs defaultValue="settings">
                    <TabsList>
                        <TabsTrigger value="actions">{t('Actions')}</TabsTrigger>
                        <TabsTrigger value="members">{t('Members')}</TabsTrigger>
                        <TabsTrigger value="settings">{t('Settings')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="actions">
                        <RadioGroup name="action" value={selectedRadioButton} onValueChange={setSelectedRadioButton}>
                            {room.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) && (
                                <>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="substructure" value="substructure" />
                                        <label htmlFor="substructure">{t('Create new substructure')}</label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="existingItem" value="existingItem" />
                                        <label htmlFor="existingItem">{t('Add existing item')}</label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="existingContext" value="existingContext" />
                                        <label htmlFor="existingContext">{t('Add existing context')}</label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="addOrCreateChat" value="addOrCreateChat" />
                                        <label htmlFor="addOrCreateChat">{t('Add existing chat or create one')}</label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="removeSpace" value="removeSpace" />
                                        <label htmlFor="removeSpace">{t('Remove items or contexts')}</label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem id="leaveRoom" value="leaveRoom" />
                                        <label htmlFor="leaveRoom">
                                            {t('Leave')} {roomName}
                                        </label>
                                    </div>
                                </>
                            )}
                        </RadioGroup>
                        <PreviousNextButtons
                            disabled={!selectedRadioButton}
                            disableNext={selectedAction}
                            disablePrev={!selectedAction}
                            onCancel={onPreviousAction}
                        />
                    </TabsContent>

                    <TabsContent value="members">
                        <UserManagement
                            roomId={currentId}
                            roomName={roomName}
                            onPreviousAction={onPreviousAction}
                            onCancel={() => setManageContextActionToggle(false)}
                        />
                    </TabsContent>

                    <TabsContent value="settings">
                        <>
                            {room.currentState.hasSufficientPowerLevelFor('m.room.topic', myPowerLevel) && (
                                <>
                                    <h3>{t('Topic (optional)')}</h3>
                                    <ChangeTopic roomId={currentId} roomName={roomName} />
                                </>
                            )}

                            {room.currentState.hasSufficientPowerLevelFor('m.room.avatar', myPowerLevel) && (
                                <>
                                    <h3>{t('Avatar')}</h3>
                                    <ChangeAvatar
                                        roomId={currentId}
                                        onPreviousAction={onPreviousAction}
                                        onCancel={() => setManageContextActionToggle(false)}
                                    />
                                </>
                            )}

                            {room.currentState.hasSufficientPowerLevelFor('m.room.join_rules', myPowerLevel) && (
                                <ChangeJoinRule
                                    roomId={currentId}
                                    roomName={roomName}
                                    onPreviousAction={onPreviousAction}
                                    onCancel={() => setManageContextActionToggle(false)}
                                />
                            )}
                        </>
                    </TabsContent>
                </Tabs>
            );
    }
};
