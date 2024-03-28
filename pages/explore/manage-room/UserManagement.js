import React from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
// import styled from 'styled-components';
import { RiAddLine, RiAdminLine, RiMoreLine, RiUserLine, RiUserSettingsLine } from '@remixicon/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
// import { MatrixEvent } from 'matrix-js-sdk';
// import { toast } from 'sonner';

import { useAuth } from '@/lib/Auth';
import { InviteUserToMatrixRoom } from '@/components/UI/InviteUsersToMatrixRoom';
import { Button } from '@/components/UI/shadcn/Button';
import Icon from '@/components/UI/Icon';
import MemberSettings from './MemberSettings';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/shadcn/Table';
import presets from '@/lib/matrixPresets';

const UserManagement = ({ roomId, roomName, myPowerLevel }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(roomId);

    // @NOTE: get the current members of the room and sort them from highest to lowest power level, and then alphabetically
    const currentMembers = _.orderBy(room?.getMembersWithMembership('join'), ['powerLevel', 'name'], ['desc', 'asc']);
    const { t } = useTranslation('explore');

    const data = currentMembers;

    /*
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
    */

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
            accessorKey: 'actions',
            header: (
                <Icon>
                    <RiUserSettingsLine />
                </Icon>
            ),
            cell: ({ row }) => {
                // const userId = row.getValue('userId');
                // const userName = row.getValue('name');
                // const userPowerLevel = row.getValue('powerLevel');

                return (
                    <div className="grid justify-end">
                        <MemberSettings
                            // matrixClient={matrixClient}
                            // myPowerLevel={myPowerLevel}
                            // userId={userId}
                            // userName={userName}
                            // userPowerLevel={userPowerLevel}
                            // presets={presets}
                            roomId={roomId}
                            roomName={roomName}
                            row={row}
                            trigger={
                                <Button
                                    // className="grid h-12 w-full grid-flow-col justify-between px-0 hover:text-accent"
                                    variant="ghost"
                                    size="icon"
                                    // disabled={row.getValue('powerLevel') >= myPowerLevel}
                                    title={t('Member settings')}
                                >
                                    <Icon>
                                        <RiMoreLine />
                                    </Icon>
                                    {/* @NOTE: maybe not necessary because of title attribute above? */}
                                    <span className="sr-only">{t('Member settings')}</span>
                                </Button>
                            }
                        />
                    </div>
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

                                            // @NOTE: the classes below are responsible for making the respective columns not wider than necessary
                                            if (cell.id.includes('name') || cell.id.includes('actions')) {
                                                return (
                                                    <TableCell className="w-[1px] whitespace-nowrap" key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                );
                                            }

                                            return (
                                                <TableCell className="flex items-center justify-between gap-2" key={cell.id}>
                                                    <div className="flex gap-2">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </div>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Thank you, {auth.user.displayname}! But our princess is in another context! 🍄
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}

            {matrixClient.getRoom(roomId)?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) && (
                <div className="sticky bottom-0 mt-[1px] flex w-full items-center space-x-2 bg-background shadow-[0px_-1px_0px_0px_hsl(var(--muted-foreground)_/_0.2)]">
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
                </div>
            )}
        </>
    );
};

export default UserManagement;
