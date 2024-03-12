import React from 'react';
import Link from 'next/link';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { RiBrush2Line, RiBrushLine, RiChat1Line, RiEditLine, RiFolderLine, RiFolderUnknowLine, RiLink } from '@remixicon/react';
import { useRouter } from 'next/router';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/UI/shadcn/DropdownMenu';
import TreeLeaves from './TreeLeaves';
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/UI/shadcn/Breadcrumb';
import LoadingSpinnerInline from '@/components/UI/LoadingSpinnerInline';
import Icon from '@/components/UI/Icon';
import { Table, TableBody } from '@/components/UI/shadcn/Table';

const TreePath = ({ selectedSpaceChildren, isFetchingContent, iframeRoomId }) => {
    const router = useRouter();
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
    const data = selectedSpaceChildren[selectedSpaceChildren.length - 1];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            <Breadcrumb>
                <BreadcrumbList>
                    {selectedSpaceChildren.map((path, index) => {
                        if (!path[0]) return null;
                        const roomId = path[0].id || path[0].room_id || path[0].roomId;

                        if (index === 0) {
                            return (
                                <BreadcrumbItem key={index}>
                                    <BreadcrumbLink asChild>
                                        <Link disabled href={`/explore/${roomId}`}>
                                            {path[0].name}
                                            {isFetchingContent === roomId && <LoadingSpinnerInline />}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            );
                        }
                    })}

                    {selectedSpaceChildren.length > 2 && (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1">
                                        <BreadcrumbEllipsis className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {selectedSpaceChildren.map((path, index) => {
                                            if (!path[0]) return null;
                                            const roomId = path[0].id || path[0].room_id || path[0].roomId;

                                            if (index > 0 && index < selectedSpaceChildren.length - 1) {
                                                return (
                                                    <DropdownMenuItem key={index} className="grid w-full grid-flow-col justify-start gap-2">
                                                        <Link href={`/explore/${roomId}`}>
                                                            {path[0].name}
                                                            {isFetchingContent === roomId && <LoadingSpinnerInline />}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                );
                                            }
                                        })}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </BreadcrumbItem>
                        </>
                    )}

                    {selectedSpaceChildren.map((path, index) => {
                        if (!path[0]) return null;
                        const roomId = path[0].id || path[0].room_id || path[0].roomId;

                        if (index === selectedSpaceChildren.length - 1 && selectedSpaceChildren.length > 1) {
                            return (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link disabled href={`/explore/${roomId}`}>
                                                {path[0].name}
                                                {isFetchingContent === roomId && <LoadingSpinnerInline />}
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </>
                            );
                        }
                    })}
                </BreadcrumbList>
            </Breadcrumb>
            <Table>
                <TableBody>
                    {iframeRoomId && table.getRowModel().rows?.length
                        ? table.getRowModel().rows.map((row, index) => {
                              const roomId = row.original.room_id || row.original.roomId || row.original.id;
                              if (index === 0) return null;

                              return (
                                  <TreeLeaves
                                      key={row.id}
                                      row={row}
                                      selected={router.query.roomId[1] === roomId || router.query.roomId[0] === roomId}
                                  />
                              );
                          })
                        : null}
                </TableBody>
            </Table>
        </>
    );
};

export default TreePath;
