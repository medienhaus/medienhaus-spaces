import React, { useCallback, useEffect, useState } from 'react';
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
    RiFolderLine,
    RiFolderSettingsLine,
    RiFolderUnknowLine,
    RiLink,
    RiPencilLine,
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
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import DefaultLayout from '../../components/layouts/default';
import QuickAddExplore from './manage-room/QuickAddExplore';
import { Button } from '@/components/UI/shadcn/Button';
import TextButton from '@/components/UI/TextButton';
import Icon from '@/components/UI/Icon';
import UserManagement from './manage-room/UserManagement';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/UI/shadcn/Table';
import TreeLeaves from './TreeLeaves';
import EllipsisMenu from './manage-room/EllipsisMenu';

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

    const [selectedSpaceChildren, setSelectedSpaceChildren] = useState([]);
    const [manageContextActionToggle, setManageContextActionToggle] = useState(false);
    const [isFetchingContent, setIsFetchingContent] = useState(false);
    // const [isInviteUsersOpen, setIsInviteUsersOpen] = useState(false);
    // const [settingsTabValue, setSettingsTabValue] = useState('settings');

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
    const currentTemplate =
        iframeRoomId &&
        selectedSpaceChildren[selectedSpaceChildren.length - 1]?.find((space) => {
            const roomId = space.id || space.room_id || space.roomId;

            return roomId === iframeRoomId;
        }).meta?.template;
    const cachedSpace = matrix.spaces.get(roomId);
    const allChatRooms = Array.from(matrix.rooms.values())
        .filter((room) => !room.meta)
        .filter((room) => !matrix.directMessages.has(room.roomId));

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

    // Call API to fetch and add room hierarchy to selectedSpaceChildren
    const getSpaceChildren = useCallback(
        async (e, roomId) => {
            if (!selectedSpaceChildren) return;
            e && e.preventDefault();
            logger.debug('Fetch the room hierarchy for ' + roomId);

            const getHierarchyFromServer = async (roomId) => {
                const roomHierarchyFromServer = await matrix.roomHierarchy(roomId, null, 1).catch(async (error) => {
                    if (error.data?.error.includes('not in room')) {
                        // If the error indicates the user is not in the room and previews are disabled
                        // We prompt the user to join the room.
                        if (
                            confirm(
                                t('You are currently not in room {{roomId}}, and previews are disabled. Do you want to join the room?', {
                                    roomId: roomId,
                                }),
                            )
                        ) {
                            const joinRoom = await matrixClient.joinRoom(roomId).catch((error) => toast.error(error.data?.error));

                            // If successfully joined, recursively call 'getSpaceHierarchy' again.
                            if (joinRoom) return await getHierarchyFromServer(roomId);
                        }
                    } else {
                        return matrix
                            .handleRateLimit(error, () => getHierarchyFromServer(roomId))
                            .catch((error) => {
                                // we don't want to display unnecessary error messages.
                                if (error.message === 'Event not found.') return;
                                if (error.message.includes('not in room')) return;
                                console.log(error);
                                toast.error(error.message);
                            }); // Handle other errors by setting an error message.
                    }
                });
                if (!roomHierarchyFromServer) return;
                const parent = roomHierarchyFromServer[0];

                const getMetaEvent = async (obj) => {
                    logger.debug('Getting meta event for ' + (obj.state_key || obj.room_id));
                    const metaEvent = await auth
                        .getAuthenticationProvider('matrix')
                        .getMatrixClient()
                        .getStateEvent(obj.state_key || obj.room_id, 'dev.medienhaus.meta');

                    if (metaEvent) obj.meta = metaEvent;
                };

                for (const space of roomHierarchyFromServer) {
                    if (space.room_id !== roomHierarchyFromServer[0].room_id) {
                        space.parent = parent;
                    }

                    await getMetaEvent(space).catch((error) => {
                        logger.debug(error);

                        return matrix
                            .handleRateLimit(error, () => getMetaEvent(space))
                            .catch((error) => {
                                // we don't want to display unnecessary error messages.
                                if (error.message === 'Event not found.') return;
                                if (error.message.includes('not in room')) return;

                                toast.error(error.message);
                            });
                    });
                }

                return roomHierarchyFromServer;
            };

            // initialise the spaceHierarchy array which is either filled by our cache or the server
            let spaceHierarchy = [];

            // if a cached space exists, we can use it to get the children
            if (cachedSpace) {
                if (cachedSpace.children) {
                    for await (const roomId of cachedSpace.children) {
                        const cachedChild = { ...(matrix.spaces.get(roomId) || matrix.rooms.get(roomId)) };

                        if (!_.isEmpty(cachedChild)) {
                            const copy = { ...cachedChild };
                            copy.parent = cachedSpace;
                            spaceHierarchy.push(copy);
                        } else {
                            const getChildFromServer = await getHierarchyFromServer(roomId);

                            getChildFromServer[0].parent = cachedSpace;
                            spaceHierarchy.push(getChildFromServer[0]);
                        }
                    }

                    // insert the cached space at the beginning of the array to mimic the behaviour of matrix.getRoomHierarchy
                    spaceHierarchy.splice(0, 0, cachedSpace);
                }
            } else {
                spaceHierarchy = await getHierarchyFromServer(roomId);
            }

            setSelectedSpaceChildren((prevState) => {
                // Check if the selected roomId is already inside the array
                let indexOfParent = null;

                for (const [index, children] of prevState.entries()) {
                    const childRoomId = children[0].room_id || children[0].roomId || children[0].id;

                    if (childRoomId === roomId) {
                        // If there is a match, return the position and exit the loop
                        indexOfParent = index;
                        break;
                    }
                }

                // If indexOfParent is 0 or the context root ID defined in the config, return the new spaceHierarchy
                if (indexOfParent === 0 || roomId === getConfig().publicRuntimeConfig.contextRootSpaceRoomId) return [spaceHierarchy];
                // Otherwise, delete all entries starting with the found index
                if (indexOfParent) prevState.splice(indexOfParent);

                // If indexOfParent is still null, simply add the new spaceHierarchy to the end of the array
                return [...prevState, spaceHierarchy];
            });
        },
        [auth, matrix, matrixClient, selectedSpaceChildren, t, cachedSpace],
    );

    // Handle route changes and fetch room content
    useEffect(() => {
        let cancelled = false;

        const onRouterChange = async () => {
            setIsFetchingContent(roomId);
            !myPowerLevel && setManageContextActionToggle(false);
            await getSpaceChildren(null, roomId);
            setIsFetchingContent(false);
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
            <DefaultLayout.Sidebar>
                <h2>/explore {_.isEmpty(selectedSpaceChildren) && isFetchingContent && <LoadingSpinnerInline />}</h2>
                <div className="w-full overflow-auto">
                    {!_.isEmpty(selectedSpaceChildren) && (
                        <TreePath
                            selectedSpaceChildren={selectedSpaceChildren}
                            isFetchingContent={isFetchingContent}
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
                                manageContextActionToggle={manageContextActionToggle}
                                myPowerLevel={myPowerLevel}
                                setManageContextActionToggle={setManageContextActionToggle}
                                // isInviteUsersOpen={isInviteUsersOpen}
                                joinRule={selectedSpaceChildren[selectedSpaceChildren.length - 1][0].join_rule}
                                // setIsInviteUsersOpen={() => setIsInviteUsersOpen((prevState) => !prevState)}
                                // setSettingsTabValue={setSettingsTabValue}
                            />
                            <div className="flex h-full w-full flex-col overflow-auto">
                                {manageContextActionToggle ? (
                                    <UserManagement roomId={roomId} roomName={matrix.spaces.get(roomId).name} myPowerLevel={myPowerLevel}>
                                        <TextButton className="w-full justify-between px-0 hover:text-accent" variant="ghost">
                                            <Icon>
                                                <RiUserLine />
                                            </Icon>
                                        </TextButton>
                                    </UserManagement>
                                ) : (
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
                                        {/*pagination component which we are currently not using, but might in the future*/}
                                        {/*{table.getRowModel().rows?.length > 1 && (*/}
                                        {/*    <div className="sticky bottom-0 flex w-full items-center space-x-2 border-t border-muted-foreground/20 bg-background py-4">*/}
                                        {/*        <div className="flex-1 text-sm text-muted-foreground">*/}
                                        {/*            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}*/}
                                        {/*        </div>*/}
                                        {/*        <div className="space-x-2">*/}
                                        {/*            <Button*/}
                                        {/*                variant="outline"*/}
                                        {/*                size="sm"*/}
                                        {/*                onClick={() => table.previousPage()}*/}
                                        {/*                disabled={!table.getCanPreviousPage()}*/}
                                        {/*            >*/}
                                        {/*                Previous*/}
                                        {/*            </Button>*/}
                                        {/*            <Button*/}
                                        {/*                variant="outline"*/}
                                        {/*                size="sm"*/}
                                        {/*                onClick={() => table.nextPage()}*/}
                                        {/*                disabled={!table.getCanNextPage()}*/}
                                        {/*            >*/}
                                        {/*                Next*/}
                                        {/*            </Button>*/}
                                        {/*        </div>*/}
                                        {/*    </div>*/}
                                        {/*)}*/}
                                        {!manageContextActionToggle &&
                                            matrixClient
                                                .getRoom(roomId)
                                                ?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel) && (
                                                <div className="sticky bottom-0 flex w-full items-center space-x-2 shadow-[0px_-1px_0px_0px_hsl(var(--muted-foreground)_/_0.2)] bg-background">
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
                            </div>
                        </DefaultLayout.Wrapper>
                    </>
                )
            )}
        </>
    );
}
