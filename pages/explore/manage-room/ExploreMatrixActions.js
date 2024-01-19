import React, { useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../lib/Auth';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import CreateContext from './CreateContext';
import AddExistingContext from './AddExistingContext';
import AddExistingItem from './AddExistingItem';
import Form from '../../../components/UI/Form';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import RemoveSpaceFromParent from './RemoveSpaceFromParent';
import UserManagement from './UserManagement';
import LeaveRoom from './LeaveRoom';
import ChangeJoinRule from './ChangeJoinRule';
import { useMatrix } from '../../../lib/Matrix';
import ChangeTopic from './ChangeTopic';
import Index from './AddOrCreateChat';
import RadioButton from '../../../components/UI/RadioButton';

/**
 * This component provides actions for managing contexts and items within a matrix room.
 *
 * @param {String} currentId - The ID of the current room.
 * @param {String} parentId - The ID of the parent of the currently observed room.
 * @param {Number} myPowerLevel - Number between 0 and 100.
 * @callback callApiAndAddToObject - A callback function.
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

const ExploreMatrixActions = ({ currentId, parentId, myPowerLevel, children, callApiAndAddToObject }) => {
    const { t } = useTranslation('explore');
    const matrix = useMatrix();
    const roomName = matrix.spaces.get(currentId)?.name || matrix.rooms.get(currentId)?.name;
    if (!roomName) return <LoadingSpinner />;

    return (
        <ExploreMatrixActionWrapper>
            <h2>{ t('Manage contexts and items within ') }{ roomName }</h2>

            { myPowerLevel && (
                <RenderSwitch
                    currentId={currentId}
                    parentId={parentId}
                    roomName={roomName}
                    children={children}
                    callApiAndAddToObject={callApiAndAddToObject}
                    myPowerLevel={myPowerLevel}
                />
            )
            }
        </ExploreMatrixActionWrapper>
    );
};

export default ExploreMatrixActions;

const RenderSwitch = ({ currentId, parentId, roomName, children, callApiAndAddToObject, myPowerLevel }) => {
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedRadioButton, setSelectedRadioButton] = useState('');
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(currentId);

    const { t } = useTranslation();

    switch (selectedAction) {
        case 'substructure':
            return <CreateContext currentId={currentId}
                parentId={parentId}
                callApiAndAddToObject={callApiAndAddToObject}
                onCancel={() => {
                    setSelectedRadioButton('');
                    setSelectedAction('');
                }} />;
        case 'existingItem':
            return <AddExistingItem currentId={currentId}
                currentName={roomName}
                onCancel={() => {
                    setSelectedRadioButton('');
                    setSelectedAction('');
                }} />;
        case 'existingContext':
            return <AddExistingContext parentId={currentId}
                parentName={roomName}
                contextRootId={getConfig().publicRuntimeConfig.contextRootSpaceRoomId}
                onCancel={() => {
                    setSelectedRadioButton('');
                    setSelectedAction('');
                }} />;
        case 'addOrCreateChat':
            return <Index
                currentId={currentId}
                parentName={roomName}
                onCancel={() => {
                    setSelectedRadioButton('');
                    setSelectedAction('');
                }}
            />;
        case 'removeSpace':
            return <RemoveSpaceFromParent parentId={currentId}
                parentName={roomName}
                children={children}
                callApiAndAddToObject={callApiAndAddToObject}
                onCancel={() => {
                    setSelectedRadioButton('');
                    setSelectedAction('');
                }} />;
        case 'manageUsers':
            return <UserManagement roomId={currentId}
                roomName={roomName}
                onCancel={() => {
                    setSelectedRadioButton('');
                    setSelectedAction('');
                }} />;
        case 'leaveRoom':
            return <LeaveRoom roomId={currentId}
                roomName={roomName}
                parentId={parentId}
                onCancel={() => {
                    setSelectedRadioButton('');
                    setSelectedAction('');
                }} />;

        case 'changeJoinRule':
            return <ChangeJoinRule
                roomId={currentId}
                roomName={roomName}
                onCancel={() => {
                    setSelectedRadioButton('');
                    setSelectedAction('');
                }} />;

        case 'changeTopic':
            return <ChangeTopic
                roomId={currentId}
                onCancel={() => {
                    setSelectedRadioButton('');
                    setSelectedAction('');
                }} />;
        default:
            return <Form
                onSubmit={(e) => {
                    //@TODO check type submit thing
                    e.preventDefault();
                    setSelectedAction(selectedRadioButton);
                }
                }
                onChange={(e) => setSelectedRadioButton(e.target.value)}
            >
                { room.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) &&
                    <>
                        <RadioButton id="substructure" name="action" value="substructure">
                            { t('Create new substructure') }
                        </RadioButton>

                        <RadioButton id="existingItem" name="action" value="existingItem">
                            { t('Add existing item') }
                        </RadioButton>

                        <RadioButton id="existingContext" name="action" value="existingContext">
                            { t('Add existing context') }
                        </RadioButton>

                        <RadioButton id="addOrCreateChat" name="action" value="addOrCreateChat">
                            { t('Add existing chat or create one') }
                        </RadioButton>

                        <RadioButton id="removeSpace" name="action" value="removeSpace">
                            { t('Remove items or contexts') }
                        </RadioButton>
                    </>
                }
                { room.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) &&
                    <RadioButton id="manageUsers" name="action" value="manageUsers">
                        { t('Manage users in') } { roomName }
                    </RadioButton> }

                <RadioButton id="leaveRoom" name="action" value="leaveRoom">
                    { t('Leave') } { roomName }
                </RadioButton>

                { room.currentState.hasSufficientPowerLevelFor('m.room.join_rules', myPowerLevel) &&
                    <RadioButton id="changeJoinRule" name="action" value="changeJoinRule">
                        { t('Change join rule') }
                    </RadioButton> }

                { room.currentState.hasSufficientPowerLevelFor('m.room.topic', myPowerLevel) &&
                    <RadioButton id="changeTopic" name="action" value="changeTopic">
                        { t('Change topic') }
                    </RadioButton> }

                <PreviousNextButtons
                    disabled={!selectedRadioButton}
                    disableNext={selectedAction}
                    disablePrev={!selectedAction}
                    onCancel={() => {
                        setSelectedRadioButton('');
                        setSelectedAction('');
                    }}
                />
            </Form>;
    }
};
