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
import { Dialog, DialogClose, DialogContent, DialogHeader } from '@/components/UI/shadcn/Dialog';
// import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader } from '@/components/UI/shadcn/Dialog';
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
            <Dialog
                open={isOpen}
                onOpenChange={(newState) => {
                    setIsOpen(newState);
                }}
            >
                <DialogContent>
                    <Tabs onValueChange={setSettingsTabValue} value={settingsTabValue}>
                        <aside className="sticky top-0 z-10 translate-y-[-1.5rem] bg-background pt-6">
                            <DialogHeader>
                                <h3>{room.name}</h3>
                                {/* <h3>{room.name} {t('settings')}</h3> */}
                            </DialogHeader>

                            <br />

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

                            <DialogClose className="absolute right-[-0.5rem] top-4 z-10 rounded border text-muted ring-offset-background transition-opacity hover:border-destructive hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                                <RiCloseLine className="h-6 w-6" />
                                <span className="sr-only">Close</span>
                            </DialogClose>

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

                        <TabsContent className="pb-6 [&>*+*]:mt-8" value="settings">
                            <>
                                {room.currentState.hasSufficientPowerLevelFor('m.room.topic', myPowerLevel) && (
                                    <div>
                                        <h3>{t('Topic')}</h3>
                                        <ChangeTopic roomId={currentId} roomName={room.name} />
                                    </div>
                                )}

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

                        {/* @NOTE: we do not want the bottom-aligned close button in this tabbed dialog */}
                        {/*
                        <DialogFooter className="pt-4 pb-8">
                            <DialogClose asChild props>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                        </DialogFooter>
                        */}
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ExploreMatrixActions;
