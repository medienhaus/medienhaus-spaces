// import getConfig from 'next/config';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
// import { MatrixEvent } from 'matrix-js-sdk';
import { Icon } from '@radix-ui/react-select';
import { RiUserUnfollowLine } from '@remixicon/react';
// import { toast } from 'sonner';

// import { Button } from '@/components/UI/shadcn/Button';
import { DrawerDialog, DrawerDialogFooter, DrawerDialogHeader } from '@/components/UI/shadcn/DialogDrawer';

/*
 * MemberSettings component
 *
 * This component is used to display a member’s role/permissions and an option to kick in a DrawerDialog.
 *
 * @TODO
 *
 */
const MemberSettings = ({ roomId, roomName, row, trigger }) => {
// const MemberSettings = ({ matrixClient, myPowerLevel, userPowerLevel, presets, roomId, roomName, row }) => {
// const MemberSettings = ({ matrixClient, myPowerLevel, userPowerLevel, presets, roomId, roomName, row, trigger }) => {
    const { t } = useTranslation('explore');

    const [isOpen, setIsOpen] = useState(false);

    // const onClose = () => {
    //     setIsOpen(false);
    // };

    // const changePowerLevel = async (userId, level, name) => {
    //     console.log(userId, level, name);
    //     const powerLevelLabel = presets.powerLevels.find((role) => {
    //         return role.level === level;
    //     }).label;
    //
    //     if (confirm(t('Are you sure you want to promote {{name}} to {{role}}', { name: name, role: powerLevelLabel }))) {
    //         const currentStateEvent = await matrixClient.getStateEvent(roomId, 'm.room.power_levels', '');
    //         const newStateEvent = new MatrixEvent({
    //             type: 'm.room.power_levels',
    //             content: currentStateEvent,
    //         });
    //
    //         try {
    //             await matrixClient.setPowerLevel(roomId, userId, level, newStateEvent);
    //             toast.success(t('Promoted {{name}} to {{role}}', { name: name, role: powerLevelLabel }));
    //         } catch (error) {
    //             toast.error(error.data.error);
    //         }
    //     }
    // };

    // const handleKick = async (userId, name) => {
    //     if (confirm(t('Are you sure you want to kick {{name}} from {{room}}', { name: name, room: roomName }))) {
    //         try {
    //             await matrixClient.kick(roomId, userId).catch((error) => toast.error(error.data.error));
    //             toast.success(t('Kicked {{name}} from {{room}}', { name: name, room: roomName }));
    //         } catch (error) {
    //             toast.error(error.data.error);
    //         }
    //     }
    // };

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
                <DrawerDialogHeader>
                    <h3>{t('Add more to {{name}}', { name: roomName })}</h3>
                </DrawerDialogHeader>

                <div className="grid grid-cols-2 gap-4">
                    {/*
                    <select
                        defaultValue={userPowerLevel}
                        disabled={userPowerLevel > myPowerLevel}
                        onChange={(e) => changePowerLevel(row.getValue('userId'), parseInt(e.target.value), row.getValue('name'))}
                    >
                        {presets.powerLevels.map((role) => {
                            return (
                                <option
                                    key={role.level}
                                    value={role.level}
                                    disabled={role.level <= userPowerLevel || role.level > myPowerLevel}
                                >
                                    {role.label}
                                </option>
                            );
                        })}
                    </select>
                    */}

                    {/*
                    <Button
                        variant="ghost"
                        size="icon"
                        // disabled={userPowerLevel >= myPowerLevel}
                        onClick={handleKick}
                        // title={t(
                        //     userPowerLevel < myPowerLevel
                        //         ? 'Kick {{user}} from {{room}}'
                        //         : 'Cannot kick {{user}}, you don’t have the required permissions',
                        //     { user: row.getValue('name'), room: roomName },
                        // )}
                    >
                        <Icon>
                            <RiUserUnfollowLine />
                        </Icon>
                        <span className="sr-only">{t('Remove {{user}} from {room}}', { user: row.getValue('name'), room: roomName })}</span>
                    </Button>
                    */}
                </div>
                <DrawerDialogFooter />
            </DrawerDialog>
        </>
    );
};

export default MemberSettings;
