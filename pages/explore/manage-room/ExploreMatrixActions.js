import React, { useState } from 'react';
import { styled } from 'styled-components';
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

const RadioWrapper = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-gap: var(--margin);
  align-content: center;
  justify-content: start;
`;

const ExploreMatrixActions = ({ currentId, parentId, myPowerLevel, spaceChildren, getSpaceChildren }) => {
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
                    spaceChildren={spaceChildren}
                    getSpaceChildren={getSpaceChildren}
                    myPowerLevel={myPowerLevel}
                />
            )
            }
        </ExploreMatrixActionWrapper>
    );
};

export default ExploreMatrixActions;

const RenderSwitch = ({ currentId, parentId, roomName, spaceChildren, getSpaceChildren, myPowerLevel }) => {
    const [selectedAction, setSelectedAction] = useState('');
    const [selectedRadioButton, setSelectedRadioButton] = useState('');
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(currentId);

    const { t } = useTranslation();

    switch (selectedAction) {
        case 'substructure':
            return <CreateContext currentId={currentId}
                parentId={parentId}
                getSpaceChildren={getSpaceChildren}
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
        case 'removeSpace':
            return <RemoveSpaceFromParent
                currentId={currentId}
                parentId={currentId}
                parentName={roomName}
                spaceChildren={spaceChildren}
                getSpaceChildren={getSpaceChildren}
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
                        <RadioWrapper>
                            <input type="radio" id="substructure" name="action" value="substructure" />
                            <label htmlFor="substructure">{ t('Create new substructure') }</label>
                        </RadioWrapper>

                        <RadioWrapper>
                            <input type="radio" id="existingItem" name="action" value="existingItem" />
                            <label htmlFor="existingItem"> { t('Add existing item') }</label>
                        </RadioWrapper>

                        <RadioWrapper>
                            <input type="radio" id="existingContext" name="action" value="existingContext" />
                            <label htmlFor="existingContext">{ t('Add existing context') }</label>
                        </RadioWrapper>

                        <RadioWrapper>
                            <input type="radio" id="removeSpace" name="action" value="removeSpace" />
                            <label htmlFor="removeSpace">{ t('Remove items or contexts') }</label>
                        </RadioWrapper>
                    </>
                }
                { room.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) &&
                    <RadioWrapper>
                        <input type="radio" id="manageUsers" name="action" value="manageUsers" />
                        <label htmlFor="manageUsers">{ t('Manage users in') } { roomName }</label>
                    </RadioWrapper> }

                <RadioWrapper>
                    <input type="radio" id="leaveRoom" name="action" value="leaveRoom" />
                    <label htmlFor="leaveRoom">{ t('Leave') } { roomName }</label>
                </RadioWrapper>

                { room.currentState.hasSufficientPowerLevelFor('m.room.join_rules', myPowerLevel) &&
                    <RadioWrapper>
                        <input type="radio" id="changeJoinRule" name="action" value="changeJoinRule" />
                        <label htmlFor="changeJoinRule">{ t('Change join rule') }</label>
                    </RadioWrapper> }

                { room.currentState.hasSufficientPowerLevelFor('m.room.topic', myPowerLevel) &&
                    <RadioWrapper>
                        <input type="radio" id="changeTopic" name="action" value="changeTopic" />
                        <label htmlFor="changeTopic">{ t('Change topic') }</label>
                    </RadioWrapper> }

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
