import { useRouter } from 'next/router';
import React from 'react';
import Link from 'next/link';
import getConfig from 'next/config';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '../../components/UI/ServiceTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const TreeLeaves = ({ leaf, selectedRoomId, isFetchingContent, small }) => {
    const router = useRouter();
    const roomId = leaf.id || leaf.room_id;
    const parentId = leaf.parent.id || leaf.parent.room_id;

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
                { leaf.missingMetaEvent ?
                    <em> <Link disabled={isFetchingContent} href={`/explore/${roomId}`}>{ leaf.name }{ isFetchingContent === roomId && <LoadingSpinnerInline /> }</Link></em>
                    :<Link disabled={isFetchingContent} href={getConfig().publicRuntimeConfig.templates?.item.includes(leaf.template) ? `/explore/${parentId}/${roomId}` : `/explore/${roomId}`}>{ leaf.name }{ isFetchingContent === roomId && <LoadingSpinnerInline /> }</Link>
                }
            </ServiceTable.Cell>
            <ServiceTable.Cell title={leaf.template}>
                { leaf.template === 'write-link' ? '📝'
                    : leaf.template === 'chat-link' ? '💬'
                        : leaf.template === 'sketch-link' ? '🎨'
                            : leaf.template === 'studentproject' && '🎓'
                }
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
};

export default TreeLeaves;
