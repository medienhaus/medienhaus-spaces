import React from 'react';
import { styled } from 'styled-components';
import { useTranslation } from 'react-i18next';

import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import UserManagement from './UserManagement';
import LeaveRoom from './LeaveRoom';
import ChangeTopic from './ChangeTopic';
import ChangeAvatar from './ChangeAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/shadcn/Tabs';
import ChangeJoinRule from './ChangeJoinRule';
import { useAuth } from '@/lib/Auth';

/**
 * This component provides actions for managing contexts and items within a matrix room.
 *
 * @param {String} currentId - The ID of the current room.
 * @param {String} parentId - The ID of the parent of the currently observed room.
 * @param {Number} myPowerLevel - Number between 0 and 100.
 * @callback getSpaceChildren - A callback function.
 * @returns {JSX.Element} - The rendered component.
 */

/* @TODO: can probably be removed */
/*
const ExploreMatrixActionWrapper = styled.div`
    width: 100%;
    max-height: 100%;
    overflow-y: auto;
    border-collapse: collapse;

    > * + * {
        margin-top: var(--margin);
    }
`;
*/

const ExploreMatrixActions = ({
    currentId,
    parentId,
    myPowerLevel,
    setManageContextActionToggle,
    setSettingsTabValue,
    settingsTabValue,
}) => {
    const { t } = useTranslation('explore');
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();

    if (!myPowerLevel) return t("You don't have the neccesarry permissions to manage this room");
    const room = matrixClient.getRoom(currentId);
    if (!room) return <LoadingSpinner />;

    return (
        /*
        <ExploreMatrixActionWrapper>
        */
        <Tabs onValueChange={setSettingsTabValue} value={settingsTabValue}>
            <TabsList>
                <TabsTrigger value="members">{t('Members')}</TabsTrigger>
                <TabsTrigger value="settings">{t('Settings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="members">
                <UserManagement
                    myPowerLevel={myPowerLevel}
                    roomId={currentId}
                    roomName={room.name}
                    onCancel={() => setManageContextActionToggle(false)}
                />
            </TabsContent>

            {/*
            @TODO: first line of tab content are not on same height;
            @TODO: remove caption? negative margin for caption/table?
            -> hence the mt-5 tailwind class below

            @NOTE: add some padding between the last element and
                   viewport bottom via mb-8 tailwind class below
            */}

            <TabsContent className="[&>*+*]:mt-8 [&>:first-child]:mt-5 [&>:last-child]:mb-8" value="settings">
                <>
                    {room.currentState.hasSufficientPowerLevelFor('m.room.topic', myPowerLevel) && (
                        <div>
                            <h3>{t('Topic (optional)')}</h3>
                            <ChangeTopic roomId={currentId} roomName={room.name} />
                        </div>
                    )}

                    {/*
                    @TODO: ChangeAvatar needs refactor; should use shadcn avatar component
                    */}
                    {room.currentState.hasSufficientPowerLevelFor('m.room.avatar', myPowerLevel) && (
                        <div>
                            <h3>{t('Avatar')}</h3>
                            <ChangeAvatar roomId={currentId} onCancel={() => setManageContextActionToggle(false)} />
                        </div>
                    )}

                    {room.currentState.hasSufficientPowerLevelFor('m.room.join_rules', myPowerLevel) && (
                        <div>
                            <ChangeJoinRule roomId={currentId} roomName={room.name} onCancel={() => setManageContextActionToggle(false)} />
                        </div>
                    )}

                    <div>
                        <LeaveRoom roomId={currentId} roomName={room.name} parentId={parentId} />
                    </div>
                </>
            </TabsContent>
        </Tabs>
        /*
        </ExploreMatrixActionWrapper>
        */
    );
};

export default ExploreMatrixActions;
