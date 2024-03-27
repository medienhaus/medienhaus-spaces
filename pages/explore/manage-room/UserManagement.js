import React from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import styled from 'styled-components';
import { RiAddLine, RiUserUnfollowLine } from '@remixicon/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { MatrixEvent } from 'matrix-js-sdk';
import { toast } from 'sonner';

import { useAuth } from '@/lib/Auth';
import { InviteUserToMatrixRoom } from '@/components/UI/InviteUsersToMatrixRoom';
import { Button } from '@/components/UI/shadcn/Button';
import Icon from '@/components/UI/Icon';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/shadcn/Table';
import presets from '@/lib/matrixPresets';

//@TODO refine styled component
const RoleSelect = styled.select`
    padding-left: 0;
    background-color: unset;
    background-image: url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMHB4IiB3aWR0aD0iMzAwcHgiIGZpbGw9InZhcigtLWNvbG9yLWZvcmVncm91bmQpIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB4PSIwcHgiIHk9IjBweCI+PHBvbHlnb24gcG9pbnRzPSI1MCA1Ny4xMyAyMy4xOSAzMC40NiAxNi4xMyAzNy41NSA1MCA3MS4yMyA4My44NiAzNy41NSA3Ni44MSAzMC40NiA1MCA1Ny4xMyI+PC9wb2x5Z29uPjwvc3ZnPg==');
    border: unset;
`;

// const UserManagement = ({ roomId, roomName, myPowerLevel, onCancel }) => {
const UserManagement = ({ roomId, roomName, myPowerLevel }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(roomId);
    // get the current members of the room and sort them first from highest to lowest power level and then alphabetically
    const currentMembers = _.orderBy(room?.getMembersWithMembership('join'), ['powerLevel', 'name'], ['desc', 'asc']);
    const { t } = useTranslation('explore');

    const handleKick = async (userId, name) => {
        if (confirm(t('Are you sure you want to kick {{name}} from {{room}}', { name: name, room: roomName }))) {
            try {
                await matrixClient.kick(roomId, userId).catch((error) => toast.error(error.data.error));
                toast.success(t('Kicked {{name}} from {{room}}', { name: name, room: roomName }));
            } catch (error) {
                toast.error(error.data.error);
            }
        }
    };

    const changePowerLevel = async (userId, level, name) => {
        console.log(userId, level, name);
        const powerLevelLabel = presets.powerLevels.find((role) => {
            return role.level === level;
        }).label;

        if (confirm(t('Are you sure you want to promote {{name}} to {{role}}', { name: name, role: powerLevelLabel }))) {
            const currentStateEvent = await matrixClient.getStateEvent(roomId, 'm.room.power_levels', '');
            const newStateEvent = new MatrixEvent({
                type: 'm.room.power_levels',
                content: currentStateEvent,
            });

            try {
                await matrixClient.setPowerLevel(roomId, userId, level, newStateEvent);
                toast.success(t('Promoted {{name}} to {{role}}', { name: name, role: powerLevelLabel }));
            } catch (error) {
                toast.error(error.data.error);
            }
        }
    };

    const data = currentMembers;
    const columns = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => row.getValue('name'),
        },
        {
            accessorKey: 'userId',
            header: 'User ID',
            cell: ({ row }) => row.getValue('userId'),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => {
                const userPowerLevel = row.getValue('powerLevel');

                return (
                    <RoleSelect
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
                    </RoleSelect>
                );
            },
        },
        {
            id: 'kick',
            header: 'Heute nicht',
            cell: ({ row }) => {
                return (
                    <Button
                        variant="ghost"
                        size="icon"
                        disabled={row.getValue('powerLevel') >= myPowerLevel}
                        onClick={handleKick}
                        title={t(
                            row.getValue('powerLevel') < myPowerLevel
                                ? 'Kick {{user}} from {{room}}'
                                : 'Cannot kick {{user}}, you don’t have the required permissions',
                            { user: row.getValue('name'), room: roomName },
                        )}
                    >
                        <RiUserUnfollowLine />
                    </Button>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (!room) return <p>Join the room to see or invite members</p>;

    return (
        <>
            {table.getRowModel().rows?.length > 0 && (
                <Table>
                    {/*
                                                  @NOTE: we cannot use border-top/-bottom for sticky thead (because borders scroll with the content);
                                                  fortunately this does not apply to box-shadow, hence the madness below; we also increase the height
                                                  from 48px (tailwind h-12 class in Table) to 50px, as the box-shadow is inset, else not shown on top
                                                */}
                    <TableHeader className="sticky top-0 h-[50px] bg-background shadow-[inset_0px_-1px_0px_0px_hsl(var(--muted-foreground)_/_0.2),inset_0px_1px_0px_0px_hsl(var(--muted-foreground)_/_0.2)]">
                        {table.getHeaderGroups().map((headerGroup) => {
                            return (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(header.column.columnDef.header, header.getContext())}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                return (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => {
                                            console.log(cell);

                                            return (
                                                <TableCell className="w-[1px] whitespace-nowrap" key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Thank you, {auth.user.displayname}! But our item is in another context! 🍄
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}

            {matrixClient.getRoom(roomId)?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) && (
                <>
                    <InviteUserToMatrixRoom
                        roomId={roomId}
                        trigger={
                            <Button className="grid h-12 w-full grid-flow-col justify-between px-0 hover:text-accent" variant="ghost">
                                {t('Invite to {{name}} …', { name: roomName })}
                                <Icon>
                                    <RiAddLine />
                                </Icon>
                            </Button>
                        }
                    />
                </>
            )}
        </>
    );
};

export default UserManagement;
