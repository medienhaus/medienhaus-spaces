import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';
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
    RiLink,
    // RiListSettingsLine,
    RiUserLine,
} from '@remixicon/react';
import { toast } from 'sonner';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import Link from 'next/link';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
// import ExploreMatrixActions from './manage-room/ExploreMatrixActions';
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
import { useGetSpaceChildren } from './useGetSpaceChildren';
import { Progress } from '@/components/UI/shadcn/Progress';
import ExploreMatrixActions from './manage-room/ExploreMatrixActions';

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
            !myPowerLevel && setActiveContentView('content');
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
            <DefaultLayout.Sidebar>
                <h2>/explore</h2>
                <div className="w-full overflow-auto">
                    {!_.isEmpty(selectedSpaceChildren) && (
                        <TreePath
                            selectedSpaceChildren={selectedSpaceChildren}
                            isFetchingContent={isFetchingSpaceChildren}
                            iframeRoomId={iframeRoomId}
                        />
                    )}
                </div>
            </DefaultLayout.Sidebar>

            {iframeRoomId ? (
                <ExploreIframeViews
                    currentTemplate={currentTemplate}
                    iframeRoomId={iframeRoomId}
                    title={
                        matrix.spaces.get(router.query.roomId[0])?.name ||
                        matrix.rooms.get(router.query.roomId[0])?.name ||
                        selectedSpaceChildren[selectedSpaceChildren.length - 1].filter((child) => child.room_id === iframeRoomId)[0]?.name
                    }
                />
            ) : (
                !_.isEmpty(selectedSpaceChildren) && (
                    <>
                        <DefaultLayout.Wrapper>
                            <ServiceIframeHeader
                                content={window.location.href}
                                title={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].name}
                                removingLink={false}
                                roomId={roomId}
                                activeContentView={activeContentView}
                                myPowerLevel={myPowerLevel}
                                setActiveContentView={setActiveContentView}
                                joinRule={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].join_rule}
                            />

                            <div className="flex h-full w-full flex-col overflow-auto">
                                {activeContentView === 'content' && (
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

                                        {matrixClient
                                            .getRoom(roomId)
                                            ?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) &&
                                            !isFetchingSpaceChildren && (<div className="sticky bottom-0 flex w-full items-center space-x-2 bg-background shadow-[0px_-1px_0px_0px_hsl(var(--muted-foreground)_/_0.2)]">
                                                <QuickAddExplore
                                                    currentId={roomId}
                                                    roomName={matrix.spaces.get(roomId).name}
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
                                    </>
                                )}

                                {activeContentView === 'members' && (
                                    <UserManagement roomId={roomId} roomName={matrix.spaces.get(roomId).name} myPowerLevel={myPowerLevel}>
                                        <TextButton className="w-full justify-between px-0 hover:text-accent" variant="ghost">
                                            <Icon>
                                                <RiUserLine />
                                            </Icon>
                                        </TextButton>
                                    </UserManagement>
                                )}

                                {activeContentView === 'settings' &&
                                    matrixClient
                                        .getRoom(roomId)
                                        ?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) && (
                                        <ExploreMatrixActions
                                            currentId={roomId}
                                            myPowerLevel={myPowerLevel}
                                            // settingsTabValue="settings"
                                            // trigger={
                                            //     <TextButton
                                            //         variant="ghost"
                                            //         title={t('Show settings of {{name}}', { name: matrix.spaces.get(roomId).name })}
                                            //     >
                                            //         <Icon>
                                            //             <RiListSettingsLine />
                                            //         </Icon>
                                            //     </TextButton>
                                            // }
                                        />
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
                            </div>
                        </DefaultLayout.Wrapper>
                    </>
                )
            )}
        </>
    );
}
