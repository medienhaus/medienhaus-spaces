import { useRouter } from 'next/router';
import {
    RiBrush2Line,
    RiBrushLine,
    RiChat1Line,
    RiEditLine,
    RiFolderLine,
    RiFolderUnknowLine,
    RiLink,
    RiMenuAddLine,
} from '@remixicon/react';
import Link from 'next/link';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import React from 'react';

import Icon from '@/components/UI/Icon';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { Table, TableBody } from '@/components/UI/shadcn/Table';
import TreeLeaves from './TreeLeaves';
import { Button } from '@/components/UI/shadcn/Button';
import QuickAddExplore from './manage-room/QuickAddExplore';
import { useAuth } from '@/lib/Auth';

const IframeSidebar = ({ selectedSpaceChildren, breadcrumbs, allChatRooms, getSpaceChildren }) => {
    const router = useRouter();
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const data = selectedSpaceChildren[selectedSpaceChildren.length - 1];
    const roomId = data?.[0].id || data?.[0].room_id || data?.[0].roomId;
    const myPowerLevel = matrixClient.getRoom(roomId)?.currentState.getMember(matrixClient.getUserId())?.powerLevel;

    const columns = [
        {
            accessorKey: 'icon',
            header: (
                <Icon>
                    <RiFolderUnknowLine />
                </Icon>
            ),
            cell: ({ row }) => {
                if (row.original?.meta?.template === 'etherpad') {
                    return (
                        <Icon>
                            <RiEditLine />
                        </Icon>
                    );
                }

                if (row.original?.meta?.template === 'spacedeck') {
                    return (
                        <Icon>
                            <RiBrush2Line />
                        </Icon>
                    );
                }

                if (row.original?.meta?.template === 'tldraw') {
                    return (
                        <Icon>
                            <RiBrushLine />
                        </Icon>
                    );
                }

                if (row.original?.meta?.template === 'link') {
                    return (
                        <Icon>
                            <RiLink />
                        </Icon>
                    );
                }

                if (row.original?.meta?.type === 'context') {
                    return (
                        <Icon>
                            <RiFolderLine />
                        </Icon>
                    );
                }

                if (!row.original?.meta) {
                    return (
                        <Icon>
                            <RiChat1Line />
                        </Icon>
                    );
                }
            },
        },
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <Link target={row.target} href={row.href} rel="noopener noreferrer" className="flex items-center justify-between">
                    {row.getValue('name')}
                </Link>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (!data) return <LoadingSpinner />;

    return (
        <>
            <header className="mb-8 grid grid-cols-[1fr_auto]">
                {breadcrumbs}
                {matrixClient.getRoom(roomId)?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) && (
                    <QuickAddExplore
                        currentId={roomId}
                        roomName={data[0].name}
                        getSpaceChildren={getSpaceChildren}
                        allChatRooms={allChatRooms}
                        trigger={
                            <Button variant="ghost" size="icon" onClick={() => console.log((prevState) => !prevState)}>
                                <Icon>
                                    <RiMenuAddLine />
                                </Icon>
                            </Button>
                        }
                    />
                )}
            </header>
            <Table>
                <TableBody>
                    {table.getRowModel().rows.map((row, index) => {
                        const roomId = row.original.room_id || row.original.roomId || row.original.id;
                        if (index === 0) return null;

                        return (
                            <TreeLeaves
                                key={row.id}
                                row={row}
                                selected={router.query.roomId[1] === roomId || router.query.roomId[0] === roomId}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default IframeSidebar;
