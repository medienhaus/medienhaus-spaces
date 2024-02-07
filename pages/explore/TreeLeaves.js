import { useRouter } from 'next/router';
import React from 'react';
import getConfig from 'next/config';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ServiceLink from '../../components/UI/ServiceLink';

const TreeLeaves = ({ leaf, selectedRoomId, isFetchingContent, small, isChat }) => {
    const router = useRouter();
    if (!leaf) return <LoadingSpinner />;

    const roomId = leaf.id || leaf.room_id || leaf.roomId;
    const parentId = leaf.parent.id || leaf.parent.room_id || leaf.parent.roomId;
    const template = leaf.meta?.template;
    // if the room is a chat or service we want to show a different icon
    const name = isChat ? '💬 ' + leaf.name
        : template === 'etherpad' ? '📝 ' + leaf.name
            : template === 'spacedeck' ? '🎨 ' + leaf.name
                : template === 'studentproject' ? '🎓 ' + leaf.name : leaf.name;
    // if an iframe is open we only want to show items in the list
    if (selectedRoomId && leaf.type !== 'item') return null;

    return (
        <ServiceLink
            small={small}
            roomId={roomId}
            href={getConfig().publicRuntimeConfig.templates?.item.includes(template) || isChat ? `/explore/${parentId}/${roomId}` : `/explore/${roomId}`}
            name={name}
            isFetchingContent={isFetchingContent}
            selected={router.query.roomId[1] === roomId || router.query.roomId[0] === roomId}
        />
    );
};

export default TreeLeaves;
