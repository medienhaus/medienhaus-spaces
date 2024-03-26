import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';
import Link from 'next/link';
import { useRouter } from 'next/router';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { EventTimeline } from 'matrix-js-sdk';
import {
    RiAddLine,
    RiBrush2Line,
    RiBrushLine,
    RiChat1Line,
    RiEditLine,
    RiFolderLine,
    RiFolderSettingsLine,
    RiFolderUnknowLine,
    RiGroupLine,
    RiLink,
    RiListSettingsLine,
    RiUserLine,
} from '@remixicon/react';
import { toast } from 'sonner';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import TreePath from './TreePath';
import ExploreIframeViews from './ExploreIframeViews';
import logger from '../../lib/Logging';
import DefaultLayout from '../../components/layouts/default';
import QuickAddExplore from './manage-room/QuickAddExplore';
import { Button } from '@/components/UI/shadcn/Button';
import TextButton from '@/components/UI/TextButton';
import Icon from '@/components/UI/Icon';
import UserManagement from './manage-room/UserManagement';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/UI/shadcn/Table';
import TreeLeaves from './TreeLeaves';
import EllipsisMenu from './manage-room/EllipsisMenu';
import { useGetSpaceChildren } from '@/components/hooks/useGetSpaceChildren';
import { Progress } from '@/components/UI/shadcn/Progress';
import ExploreMatrixActions from './manage-room/ExploreMatrixActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/UI/shadcn/Tabs';
import { useMediaQuery } from '@/lib/utils';

/**
 * Explore component for managing room hierarchies and content.
 *
 * @component
 * @returns {JSX.Element} The rendered Explore component.
 */

//@TODO cached spaces do not update after editing

export default function Explore() {
    const router = useRouter();
    const { t } = useTranslation('explore');

    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix();

    const [activeContentView, setActiveContentView] = useState('content');

    const isDesktop = useMediaQuery('(min-width: 768px)');

    // Extract roomId and iframeRoomId from the query parameters
    /** @type {string|undefined} */
    const roomId = _.get(router, 'query.roomId.0');
    /** @type {string|undefined} */
    const iframeRoomId = _.get(router, 'query.roomId.1');
    /**
     * If we have access to the room/space "roomId", this variable contains our own power level for the given room
     * @type {number|undefined}
     */
    const myPowerLevel = _.get(
        matrixClient
            .getRoom(roomId)
            ?.getLiveTimeline()
            .getState(EventTimeline.FORWARDS)
            ?.getStateEvents('m.room.power_levels', '')
            ?.getContent(),
        ['users', matrixClient.getUserId()],
    );
    /** @type {string|undefined} */

    const cachedSpace = matrix.spaces.get(roomId);
    const allChatRooms = Array.from(matrix.rooms.values())
        .filter((room) => !room.meta)
        .filter((room) => !matrix.directMessages.has(room.roomId));

    const { isFetchingSpaceChildren, progress, getSpaceChildren, selectedSpaceChildren } = useGetSpaceChildren(
        auth,
        matrix,
        matrixClient,
        cachedSpace,
    );
    const currentTemplate =
        iframeRoomId &&
        selectedSpaceChildren[selectedSpaceChildren.length - 1]?.find((space) => {
            const roomId = space.id || space.room_id || space.roomId;

            return roomId === iframeRoomId;
        }).meta?.template;

    const canManageSpace = matrixClient.getRoom(roomId)?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel);
    const canAddMoreContent = canManageSpace && !isFetchingSpaceChildren;

    // Redirect to the default room if no roomId is provided
    useEffect(() => {
        if (!roomId) {
            router.push(`/explore/${getConfig().publicRuntimeConfig.contextRootSpaceRoomId}`);
        }
    }, [roomId, router]);

    // Fetch room content when the iframeRoomId changes
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const checkForRoomContent = async () => {
            await matrix.hydrateRoomContent(iframeRoomId, signal).catch((error) => {
                logger.error(error);
            });
        };

        iframeRoomId && checkForRoomContent();

        return () => controller.abort();
    }, [iframeRoomId, matrix]);

    // Handle route changes and fetch room content
    useEffect(() => {
        let cancelled = false;

        const onRouterChange = async () => {
            setActiveContentView('content');
            // !myPowerLevel && setActiveContentView('content');
            await getSpaceChildren(null, roomId);
        };

        if (!cancelled && matrix.initialSyncDone && router.query?.roomId) {
            onRouterChange();
        }

        return () => {
            cancelled = true;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.query?.roomId, matrix.initialSyncDone, cachedSpace]);

    const removeChildFromParent = async (idToRemove) => {
        if (idToRemove === roomId) {
            toast.error('You cannot remove the parent room from itself');

            return false;
        }

        if (!idToRemove) {
            toast.error('No room id provided');

            return false;
        }

        await auth
            .getAuthenticationProvider('matrix')
            .removeSpaceChild(roomId, idToRemove)
            .catch((error) => {
                logger.error(error.data?.error);

                return toast.error(error.data?.error);
            });
        await getSpaceChildren(null, roomId);

        return true;
    };

    const getIcon = (template) => {
        if (template === 'etherpad') return <RiEditLine />;
        if (template === 'spacedeck') return <RiBrush2Line />;
        if (template === 'tldraw') return <RiBrushLine />;
        if (template === 'link') return <RiLink />;

        return <RiFolderUnknowLine />;
    };

    const data = selectedSpaceChildren[selectedSpaceChildren.length - 1];
    const columns = [
        {
            accessorKey: 'icon',
            header: (
                <Icon>
                    <RiFolderUnknowLine />
                </Icon>
            ),
            cell: ({ row }) => {
                const template = row.original?.meta?.template;
                const type = row.original?.meta?.type;

                return <Icon>{type === 'context' ? <RiFolderLine /> : !row.original?.meta ? <RiChat1Line /> : getIcon(template)}</Icon>;
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
        {
            id: 'actions',
            header: (
                <Icon>
                    <RiFolderSettingsLine />
                </Icon>
            ),
            cell: ({ row }) => {
                return (
                    <div className="grid justify-end">
                        <EllipsisMenu
                            parentName={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name}
                            onRemove={() => removeChildFromParent(row.roomId)}
                            myPowerLevel={myPowerLevel}
                            parentRoomId={roomId}
                            name={row.name}
                            href={row.href}
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

    if (typeof window === 'undefined') return <LoadingSpinner />;

    return (
        <>
            {progress !== 0 && (
                <div className="absolute left-0 top-0 w-full">
                    <Progress value={progress} />
                </div>
            )}
            {iframeRoomId ? (
                <ExploreIframeViews
                    selectedSpaceChildren={selectedSpaceChildren}
                    allChatRooms={allChatRooms}
                    getSpaceChildren={getSpaceChildren}
                    currentTemplate={currentTemplate}
                    iframeRoomId={iframeRoomId}
                    breadcrumbs={
                        !_.isEmpty(selectedSpaceChildren) && (
                            <TreePath selectedSpaceChildren={selectedSpaceChildren} iframeRoomId={iframeRoomId} />
                        )
                    }
                    title={name}
                />
            ) : (
                !_.isEmpty(selectedSpaceChildren) && (
                    <>
                        <DefaultLayout.Wrapper>
                            <ServiceIframeHeader
                                content={window.location.href}
                                title={
                                    !_.isEmpty(selectedSpaceChildren) && (
                                        <TreePath selectedSpaceChildren={selectedSpaceChildren} iframeRoomId={iframeRoomId} />
                                    )
                                }
                                removingLink={false}
                                roomId={roomId}
                                activeContentView={activeContentView}
                                myPowerLevel={myPowerLevel}
                                setActiveContentView={setActiveContentView}
                                joinRule={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].join_rule}
                            />

                            {/*
                                      @TODO: check this condition; is it really the same as for settings?
                                      @NOTE: also see further below
                                    */}
                            <Tabs
                                className="w-full min-[767px]:overflow-auto [&>[role=tabpanel]]:pt-2"
                                onValueChange={setActiveContentView}
                                value={activeContentView}
                            >
                                <TabsList className="[&>[role=tab]]:gap-2">
                                    <TabsTrigger
                                        onClick={() => {
                                            setActiveContentView('content');
                                        }}
                                        title={t('Show contexts and items of {{name}}', {
                                            name: selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name,
                                        })}
                                        value="content"
                                    >
                                        <Icon>
                                            <RiFolderLine />
                                        </Icon>
                                        {isDesktop && t('Content')}
                                    </TabsTrigger>

                                    <TabsTrigger
                                        onClick={() => {
                                            setActiveContentView('members');
                                        }}
                                        title={t('Show members of {{name}}', {
                                            name: selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name,
                                        })}
                                        value="members"
                                    >
                                        <Icon>
                                            <RiGroupLine />
                                        </Icon>
                                        {isDesktop && t('Members')}
                                    </TabsTrigger>
                                    {canManageSpace && (
                                        <TabsTrigger
                                            onClick={() => {
                                                setActiveContentView('settings');
                                            }}
                                            title={t('Show settings of {{name}}', {
                                                name: selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name,
                                            })}
                                            value="settings"
                                        >
                                            <Icon>
                                                <RiListSettingsLine />
                                            </Icon>
                                            {isDesktop && t('Settings')}
                                        </TabsTrigger>
                                    )}
                                </TabsList>
                                <TabsContent value="content">
                                    <>
                                        {table.getRowModel().rows?.length > 1 && (
                                            <Table>
                                                {/*
                                                  @NOTE: we cannot use border-top/-bottom for sticky thead (because borders scroll with the content);
                                                  fortunately this does not apply to box-shadow, hence the madness below; we also increase the height
                                                  from 48px (tailwind h-12 class in Table) to 50px, as the box-shadow is inset, else not shown on top
                                                */}
                                                <TableHeader className="sticky top-0 h-[50px] bg-background shadow-[inset_0px_-1px_0px_0px_hsl(var(--muted-foreground)_/_0.2),inset_0px_1px_0px_0px_hsl(var(--muted-foreground)_/_0.2)]">
                                                    {table.getHeaderGroups().map((headerGroup) => (
                                                        <TableRow key={headerGroup.id}>
                                                            {headerGroup.headers.map((header) => {
                                                                return (
                                                                    <TableHead key={header.id}>
                                                                        {header.isPlaceholder
                                                                            ? null
                                                                            : flexRender(
                                                                                  header.column.columnDef.header,
                                                                                  header.getContext(),
                                                                              )}
                                                                    </TableHead>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    ))}
                                                </TableHeader>

                                                <TableBody>
                                                    {table.getRowModel().rows?.length ? (
                                                        table.getRowModel().rows.map((row, index) => {
                                                            if (index === 0) return null;

                                                            return <TreeLeaves key={row.id} row={row} />;
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

                                        {canAddMoreContent && (
                                            <div className="sticky bottom-0 flex w-full items-center space-x-2 bg-background shadow-[0px_-1px_0px_0px_hsl(var(--muted-foreground)_/_0.2)]">
                                                <QuickAddExplore
                                                    currentId={roomId}
                                                    roomName={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name}
                                                    getSpaceChildren={getSpaceChildren}
                                                    allChatRooms={allChatRooms}
                                                    trigger={
                                                        <Button
                                                            className="grid h-12 w-full grid-flow-col justify-between px-0 hover:text-accent"
                                                            variant="ghost"
                                                            // onClick={() => setIsQuickAddOpen((prevState) => !prevState)}
                                                        >
                                                            {t('Add more …')}
                                                            <Icon>
                                                                <RiAddLine />
                                                            </Icon>
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        )}

                                        {/* @NOTE: pagination component which we are currently not using, but might in the future
                                            {table.getRowModel().rows?.length > 1 && (
                                                <div className="sticky bottom-0 flex w-full items-center space-x-2 border-t border-muted-foreground/20 bg-background py-4">
                                                    <div className="flex-1 text-sm text-muted-foreground">
                                                        Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                                                    </div>
                                                    <div className="space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => table.previousPage()}
                                                            disabled={!table.getCanPreviousPage()}
                                                        >
                                                            Previous
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => table.nextPage()}
                                                            disabled={!table.getCanNextPage()}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            */}
                                    </>
                                </TabsContent>

                                <TabsContent value="members">
                                    <UserManagement
                                        roomId={roomId}
                                        roomName={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name}
                                        myPowerLevel={myPowerLevel}
                                    >
                                        <TextButton className="w-full justify-between px-0 hover:text-accent" variant="ghost">
                                            <Icon>
                                                <RiUserLine />
                                            </Icon>
                                        </TextButton>
                                    </UserManagement>
                                </TabsContent>

                                <TabsContent value="settings">
                                    <ExploreMatrixActions currentId={roomId} myPowerLevel={myPowerLevel} />
                                </TabsContent>
                            </Tabs>
                        </DefaultLayout.Wrapper>
                    </>
                )
            )}
        </>
    );
}
