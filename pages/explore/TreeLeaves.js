import { useRouter } from 'next/router';
import React, { useState } from 'react';

import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';
import { ServiceTable } from '../../components/UI/ServiceTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
const TreeLeaves = ({ handleClick, depth, leaf, parent, selectedRoomId, activePath }) => {
    const [fetchingLeaves, setFetchingLeaves] = useState(false);
    const router = useRouter();
    const roomId = leaf.id || leaf.room_id;

    const onClick = async (e, id, index, leafTemplate, parentId) => {
        e.preventDefault();
        setFetchingLeaves(id);
        await handleClick(e, id || roomId, index, leafTemplate, parentId);
        setFetchingLeaves(false);
    };

    if (!leaf) return <LoadingSpinner />;

    // if the roomId is the selected space we skip it
    if (roomId === router.query.roomId[0]) return null;

    // if an iframe is open we only want to show items in the list
    if (selectedRoomId && leaf.type !== 'item') return null;

    return (
        <ServiceTable.Row key={roomId} disabled={fetchingLeaves}>
            <ServiceTable.Cell
                disabled={fetchingLeaves}
                selected={router.query.roomId[1] === roomId || activePath.indexOf(roomId) > -1}
                onClick={(e) => onClick(e, roomId, depth, leaf.template, parent)}>
                { leaf.missingMetaEvent ?
                    <em> <a href="">{ leaf.name }{ fetchingLeaves === roomId && <LoadingSpinnerInline /> }</a></em>
                    : <a href="">{ leaf.name }{ fetchingLeaves === roomId && <LoadingSpinnerInline /> }</a>
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
