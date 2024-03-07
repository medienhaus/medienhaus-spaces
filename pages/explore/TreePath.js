import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '@/components/UI/ServiceTable';
import TreeLeaves from './TreeLeaves';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';

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
    const columns = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <Link
                    ref={row.getValue('ref')}
                    target={row.target}
                    href={row.href}
                    rel="noopener noreferrer"
                    className="flex items-center justify-between"
                >
                    {row.name}
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
            {iframeRoomId && table.getRowModel().rows?.length
                ? table.getRowModel().rows.map((row, index) => {
                      if (index === 0) return null;
                      return <TreeLeaves row={row} />;
                  })
                : null}
        </ServiceTable>
    );
};

export default TreePath;
