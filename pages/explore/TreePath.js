import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { RiBrush2Line, RiBrushLine, RiChat1Line, RiFolderLine, RiFolderUnknowLine, RiLink, RiPencilLine } from '@remixicon/react';
import { useRouter } from 'next/router';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '@/components/UI/ServiceTable';
import TreeLeaves from './TreeLeaves';
import Icon from '@/components/UI/Icon';
import { Table, TableBody } from '@/components/UI/shadcn/Table';

const Leaf = styled(ServiceTable.Cell)`
    cursor: pointer;
    animation: fade-in 0.3s;

    a {
        &:hover {
            text-decoration: underline;
            cursor: pointer;
        }
    }

    @keyframes fade-in {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
`;

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
                            <RiPencilLine />
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
            <ServiceTable>
                {selectedSpaceChildren.map((path, index) => {
                    if (!path[0]) return null;
                    const roomId = path[0].id || path[0].room_id || path[0].roomId;

                    return (
                        <ServiceTable.Row key={index}>
                            <Leaf selected disabled={isFetchingContent}>
                                <Link disabled href={`/explore/${roomId}`}>
                                    {index > 0 && '↳ '}
                                    {path[0].name}
                                    {isFetchingContent === roomId && <LoadingSpinnerInline />}
                                </Link>
                            </Leaf>
                        </ServiceTable.Row>
                    );
                })}
            </ServiceTable>
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
