import { useRouter } from 'next/router';
import React from 'react';
import Link from 'next/link';
import getConfig from 'next/config';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '../../components/UI/ServiceTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const TreeLeaves = ({ leaf, selectedRoomId, isFetchingContent, small, isChat }) => {
    const router = useRouter();
    const roomId = leaf.id || leaf.room_id || leaf.roomId;
    const parentId = leaf.parent.id || leaf.parent.room_id || leaf.parent.roomId;
    const template = leaf.meta?.template;
    if (!leaf) return <LoadingSpinner />;
    // if an iframe is open we only want to show items in the list
    if (selectedRoomId && leaf.type !== 'item') return null;

    return (
        <ServiceTable.Row key={roomId} disabled={isFetchingContent}>
            <ServiceTable.Cell
                disabled={isFetchingContent}
                selected={router.query.roomId[1] === roomId|| router.query.roomId[0] === roomId}
                small={small}
            >
                <Link disabled={isFetchingContent} href={getConfig().publicRuntimeConfig.templates?.item.includes(template) || isChat ? `/explore/${parentId}/${roomId}` : `/explore/${roomId}`}>{ leaf.name }{ isFetchingContent === roomId && <LoadingSpinnerInline /> }</Link>
            </ServiceTable.Cell>
            <ServiceTable.Cell title={isChat ? 'chat' : template}>
                { isChat ? '💬'
                    : template === 'etherpad' ? '📝'
                        : template === 'spacedeck' ? '🎨'
                            : template === 'studentproject' && '🎓'
                }
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
};

export default TreeLeaves;
