import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import LoadingSpinner from '../../../components/UI/LoadingSpinner';
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

const ExploreMatrixActions = ({
    currentId,
    parentId,
    myPowerLevel,
}) => {
    const { t } = useTranslation('explore');
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();

    const [settingsTabValue, setSettingsTabValue] = useState('settings');

    if (!myPowerLevel) return t("You don't have the neccesarry permissions to manage this room");
    const room = matrixClient.getRoom(currentId);
    if (!room) return <LoadingSpinner />;

    return (
        <>
            <Tabs className="[&>[role=tabpanel]]:pt-6" onValueChange={setSettingsTabValue} value={settingsTabValue}>
                <TabsList>
                    <TabsTrigger
                        onClick={() => {
                            setSettingsTabValue('settings');
                        }}
                        value="settings"
                    >
                        {t('Settings')}
                    </TabsTrigger>

                    <TabsTrigger
                        onClick={() => {
                            setSettingsTabValue('advanced');
                        }}
                        value="advanced"
                    >
                        {t('Advanced')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent className="pb-6 [&>*+*]:mt-8" value="settings">
                    <>
                        {room.currentState.hasSufficientPowerLevelFor('m.room.topic', myPowerLevel) && (
                            <div className="[&>*+*]:mt-4">
                                <h3>{t('Topic')}</h3>
                                <ChangeTopic roomId={currentId} roomName={room.name} />
                            </div>
                        )}

                        {room.currentState.hasSufficientPowerLevelFor('m.room.avatar', myPowerLevel) && (
                            <div className="[&>*+*]:mt-4">
                                <h3>{t('Avatar')}</h3>
                                <ChangeAvatar
                                    roomId={currentId}
                                />
                            </div>
                        )}
                    </>
                </TabsContent>

                <TabsContent className="pb-6 [&>*+*]:mt-8" value="advanced">
                    {room.currentState.hasSufficientPowerLevelFor('m.room.join_rules', myPowerLevel) && (
                        <div>
                            <ChangeJoinRule
                                roomId={currentId}
                                roomName={room.name}
                            />
                        </div>
                    )}

                    <div>
                        <LeaveRoom roomId={currentId} roomName={room.name} parentId={parentId} />
                    </div>
                </TabsContent>
            </Tabs>
        </>
    );
};

export default ExploreMatrixActions;
