import getConfig from 'next/config';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { RiBrush2Line, RiBrushLine, RiChat1Line, RiEditLine, RiFolderLine, RiFolderUnknowLine, RiLink } from '@remixicon/react';
import { useRouter } from 'next/router';

import ServiceIframeHeader from '../../components/UI/ServiceIframeHeader';
import ChatIframeView from '../chat/ChatIframeView';
import ProjectView from './ProjectView';
import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import DefaultLayout from '../../components/layouts/default';
import Icon from '@/components/UI/Icon';
import { Table, TableBody } from '@/components/UI/shadcn/Table';
import TreeLeaves from './TreeLeaves';

const ExploreIframeViews = ({ currentTemplate, iframeRoomId, title: parsedTitle, selectedSpaceChildren, isFetchingContent }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const etherpad = auth.getAuthenticationProvider('etherpad');
    const router = useRouter();

    const [title, setTitle] = useState(parsedTitle);

    const iframeUrl = currentTemplate ? new URL(matrix.roomContents.get(iframeRoomId)?.body) : iframeRoomId;

    // add auth token to etherpad iframe, so authors of the pad don't have to input the password again
    if (currentTemplate === 'etherpad') {
        iframeUrl.searchParams.set('auth_token', etherpad.getToken());
    }

    useEffect(() => {
        let cancelled = false;

        const fetchRoomName = async () => {
            if (parsedTitle) setTitle(parsedTitle);
            else {
                const nameEvent = await matrixClient.getStateEvent(iframeRoomId, 'm.room.name').catch(() => {});
                setTitle(nameEvent?.name);
            }
        };

        if (!cancelled) fetchRoomName();

        return () => (cancelled = true);
    }, [iframeRoomId, matrixClient, parsedTitle]);

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
        <DefaultLayout.Wrapper>
            <ServiceIframeHeader content={matrix.roomContents.get(iframeRoomId)?.body} title={title} removingLink={false} />
            <DefaultLayout.ExploreWrapper>
                {iframeRoomId && data && (
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
                )}
                {/*{!_.isEmpty(selectedSpaceChildren) && (*/}
                {/*    <TreePath*/}
                {/*        selectedSpaceChildren={selectedSpaceChildren}*/}
                {/*        isFetchingContent={isFetchingContent}*/}
                {/*        iframeRoomId={iframeRoomId}*/}
                {/*    />*/}
                {/*)}*/}
                {(() => {
                    switch (currentTemplate) {
                        case 'studentproject':
                            return <ProjectView content={iframeUrl} />;
                        case 'etherpad':
                            return (
                                <>
                                    <iframe title="etherpad" src={iframeUrl} />
                                </>
                            );
                        case 'spacedeck':
                            return (
                                <>
                                    <iframe title="sketch" src={matrix.roomContents.get(iframeRoomId)?.body} />
                                </>
                            );
                        case 'link':
                            return (
                                <>
                                    <iframe title="sketch" src={iframeUrl} />
                                </>
                            );
                        default:
                            return (
                                <ChatIframeView
                                    title={title}
                                    src={`${getConfig().publicRuntimeConfig.chat.pathToElement}/#/room/${iframeRoomId}`}
                                    roomId={iframeRoomId}
                                />
                            );
                    }
                })()}
            </DefaultLayout.ExploreWrapper>
        </DefaultLayout.Wrapper>
    );
};

export default ExploreIframeViews;
