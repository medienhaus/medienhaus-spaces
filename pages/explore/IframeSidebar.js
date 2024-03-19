import { useRouter } from 'next/router';
import { RiBrush2Line, RiBrushLine, RiChat1Line, RiEditLine, RiFolderLine, RiFolderUnknowLine, RiLink } from '@remixicon/react';
import Link from 'next/link';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

import Icon from '@/components/UI/Icon';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { Table, TableBody } from '@/components/UI/shadcn/Table';
import TreeLeaves from './TreeLeaves';

const IframeSidebar = ({ selectedSpaceChildren }) => {
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

    if (!data) return <LoadingSpinner />;

    return (
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
    );
};

export default IframeSidebar;
