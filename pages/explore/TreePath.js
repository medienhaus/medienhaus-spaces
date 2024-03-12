import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/UI/shadcn/DropdownMenu';
import { ServiceTable } from '@/components/UI/ServiceTable';
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
            {iframeRoomId &&
                selectedSpaceChildren[selectedSpaceChildren.length - 1]
                    .sort(function (a, b) {
                        if (a.type === 'item' && b.type !== 'item') {
                            return -1; // 'a' comes before 'b'
                        } else if (a.type !== 'item' && b.type === 'item') {
                            return 1; // 'a' comes after 'b'
                        } else {
                            return 0; // No sorting necessary
                        }
                    })
                    .map((leaf, index) => {
                        if (leaf.length <= 1) {
                            return;
                        }

                        if (index === 0) return null;

                        // Sort the array to display objects of type 'item' before others
                        return (
                            <TreeLeaves
                                small
                                depth={selectedSpaceChildren.length}
                                leaf={leaf}
                                parent={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].room_id}
                                key={leaf.room_id + '_' + index}
                                iframeRoomId={iframeRoomId}
                                isFetchingContent={isFetchingContent}
                                isChat={(!leaf.meta && !leaf.room_type) || (!leaf.meta && leaf.room_type === 'm.room')} // chat rooms created with element do not have a room_type attribute. therefore we have to check for both cases
                            />
                        );
                    })}
        </>
    );
};

export default TreePath;
