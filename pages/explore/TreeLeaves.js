import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';
import { flexRender } from '@tanstack/react-table';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import logger from '@/lib/Logging';
import { TableCell, TableRow } from '@/components/UI/shadcn/Table';

const TreeLeaves = ({ row, parentName, selectedRoomId, isFetchingContent, small, onRemove, myPowerLevel }, ref) => {
    const auth = useAuth();
    const matrix = useMatrix();
    console.log(row);
    const etherpad = auth.getAuthenticationProvider('etherpad');
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);

    const roomId = row.original.id || row.original.room_id || row.original.roomId;
    const parentId = row.original.parent.id || row.original.parent.room_id || row.original.parent.roomId;
    const template = row.original.meta?.template;
    const externalUrl = template === 'link' && matrix.roomContents.get(roomId)?.body;
    const isChat = (!row.original.meta && !row.original.room_type) || (!row.original.meta && row.original.room_type === 'm.room');
    // if the room is a chat or service we want to show a different icon
    row.ref = ref;
    row.href = externalUrl
        ? externalUrl
        : Object.keys(getConfig().publicRuntimeConfig.authProviders)?.includes(template) || isChat
          ? `/explore/${parentId}/${roomId}`
          : `/explore/${roomId}`;
    row.roomId = roomId;

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        if (template === 'etherpad') {
            const checkIfPadHasPassword = async () => {
                let url = matrix.roomContents.get(roomId);

                if (!url) {
                    url = await matrix.hydrateRoomContent(roomId, signal).catch((error) => {
                        if (error.name === 'AbortError') {
                            console.log('AbortError: Fetch request aborted');
                        }

                        return null;
                    });
                }

                if (!url?.body) return false;
                const padId = url.body.split('/').pop();

                return etherpad.isPadPasswordProtected(padId);
            };

            checkIfPadHasPassword().then(setIsPasswordProtected);
        }

        if (template === 'link') {
            const hydrateContent = async () => {
                if (!matrix.roomContents.get(roomId)?.body) {
                    await matrix.hydrateRoomContent(roomId, signal).catch((error) => {
                        if (error.name === 'AbortError') {
                            logger.error('AbortError: Fetch request aborted');
                        } else {
                            logger.error('Error hydrating room content', error);
                        }
                    });
                }
            };

            hydrateContent();
        }

        return () => controller.abort();
    }, [etherpad, matrix, matrix.roomContents, roomId, template]);

    if (!row.original) return <LoadingSpinner />;

    // if an iframe is open we only want to show items in the list
    if (selectedRoomId && row.original.type !== 'item') return null;

    return (
        <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => {
                // @NOTE: the classes below are responsible for making the respective columns not wider than necessary
                if (cell.id.includes('icon') || cell.id.includes('actions')) {
                    return (
                        <TableCell className="whitespace-nowrap w-[1px]" key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    );
                }

                return (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                );
            })}
        </TableRow>
    );
};

export default TreeLeaves;
