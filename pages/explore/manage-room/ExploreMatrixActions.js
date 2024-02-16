import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import UserManagement from './UserManagement';
import LeaveRoom from './LeaveRoom';
import ChangeTopic from './ChangeTopic';
import ChangeAvatar from './ChangeAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/shadcn/Tabs';
import ChangeJoinRule from './ChangeJoinRule';
import { useAuth } from '@/lib/Auth';
import { DrawerDialog, DrawerDialogHeader } from '@/components/UI/shadcn/DialogDrawer';

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
    // @TODO: do we still need the following ?
    setManageContextActionToggle,
    trigger,
}) => {
    const { t } = useTranslation('explore');
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();

    const [isOpen, setIsOpen] = useState(false);
    const [settingsTabValue, setSettingsTabValue] = useState('settings');

    if (!myPowerLevel) return t("You don't have the neccesarry permissions to manage this room");
    const room = matrixClient.getRoom(currentId);
    if (!room) return <LoadingSpinner />;

    return (
        <>
            {React.cloneElement(trigger, {
                onClick: () => {
                    setIsOpen(true);
                },
            })}
            <DrawerDialog
                isOpen={isOpen}
                onOpenChange={(newState) => {
                    setIsOpen(newState);
                }}
            >
                <Tabs onValueChange={setSettingsTabValue} value={settingsTabValue}>
                    <aside className="sticky top-0 z-10 translate-y-[-1.5rem] bg-background pt-6">
                        <DrawerDialogHeader>
                            <h3>{t('/explore actions')}</h3>
                        </DrawerDialogHeader>

                        <br />

                        <TabsList>
                            {/* @NOTE: we do not want the members list as a tab in dialog/drawer */}
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
                        </TabsList>

                        {/* @NOTE: needs two <br /> elements before <hr />, as <TabsList /> is display:inline; */}
                        <br />
                        <br />
                        <hr />
                    </aside>

                    {/*
                    <TabsContent className="overflow-y-auto" value="members">
                        <UserManagement
                            myPowerLevel={myPowerLevel}
                            roomId={currentId}
                            roomName={room.name}
                            // @TODO: do we still need the following ?
                            onCancel={() => setManageContextActionToggle(false)}
                        />
                    </TabsContent>
                    */}

                    {/*
                    @TODO: first line of tab content are not on same height;
                    @TODO: remove caption? negative margin for caption/table?
                    */}

                    <TabsContent className="pb-6 [&>*+*]:mt-8" value="settings">
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
                                    <ChangeAvatar
                                        roomId={currentId}
                                        /* @TODO: do we still need the following ? */
                                        onCancel={() => setManageContextActionToggle(false)}
                                    />
                                </div>
                            )}

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
                        </>
                    </TabsContent>
                </Tabs>
            </DrawerDialog>
        </>
    );
};

export default ExploreMatrixActions;
