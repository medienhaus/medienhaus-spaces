import React from 'react';
import Link from 'next/link';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/UI/shadcn/DropdownMenu';
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/UI/shadcn/Breadcrumb';

const TreePath = ({ selectedSpaceChildren }) => {
    return (
        <>
            <Breadcrumb className="overflow-hidden">
                <BreadcrumbList>
                    {selectedSpaceChildren.length > 1 && (
                        <>
                            <BreadcrumbItem className="inline text-ellipsis whitespace-nowrap">
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="flex items-center gap-1">
                                        <BreadcrumbEllipsis />
                                        <span className="sr-only">Toggle menu</span>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {selectedSpaceChildren.map((path, index) => {
                                            if (!path[0]) return null;
                                            const roomId = path[0].id || path[0].room_id || path[0].roomId;

                                            if (index < selectedSpaceChildren.length - 1) {
                                                return (
                                                    <DropdownMenuItem key={index} className="grid w-full grid-flow-col justify-start gap-2">
                                                        <Link href={`/explore/${roomId}`}>{path[0].name}</Link>
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

                        if (index === selectedSpaceChildren.length - 1) {
                            return (
                                <>
                                    {selectedSpaceChildren.length > 1 && <BreadcrumbSeparator />}
                                    <BreadcrumbItem className="inline overflow-hidden text-ellipsis whitespace-nowrap">
                                        <BreadcrumbLink asChild>
                                            <Link disabled href={`/explore/${roomId}`}>
                                                {path[0].name}
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </>
                            );
                        }
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </>
    );
};

export default TreePath;
