import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RiCloseLine } from '@remixicon/react';

import LoadingSpinner from '../../../components/UI/LoadingSpinner';
// import UserManagement from './UserManagement';
import LeaveRoom from './LeaveRoom';
import ChangeTopic from './ChangeTopic';
import ChangeAvatar from './ChangeAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/shadcn/Tabs';
import ChangeJoinRule from './ChangeJoinRule';
import { useAuth } from '@/lib/Auth';
// import { Button } from '@/components/UI/shadcn/Button';

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
    // @TODO: do we still need the following ?
    setManageContextActionToggle,
    trigger,
}) => {
    const { t } = useTranslation('explore');
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();

    const [settingsTabValue, setSettingsTabValue] = useState('settings');

    if (!myPowerLevel) return t("You don't have the neccesarry permissions to manage this room");
    const room = matrixClient.getRoom(currentId);
    if (!room) return <LoadingSpinner />;

    return (
        <>
            <Tabs onValueChange={setSettingsTabValue} value={settingsTabValue}>
                <TabsList>
                    {/* @NOTE: we do not want the members list as a tab in dialog */}
                    {/*
                                <TabsTrigger
                                    onClick={() => {
                                        setSettingsTabValue('members');
                                    }}
                                    value="members"
                                >
                                    {t('Members')}
                                </TabsTrigger>
                                */}

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
                                    /* @TODO: do we still need the following ? */
                                    onCancel={() => setManageContextActionToggle(false)}
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
                                /* @TODO: do we still need the following ? */
                                onCancel={() => setManageContextActionToggle(false)}
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
