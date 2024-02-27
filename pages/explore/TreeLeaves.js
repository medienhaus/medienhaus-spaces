import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ServiceLink from '../../components/UI/ServiceLink';
import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';

const getIcon = (template, name) => {
    switch (template) {
        case 'etherpad':
            return '📝 ' + name;
        case 'spacedeck':
            return '🎨 ' + name;
        case 'studentproject':
            return '🎓 ' + name;
        default:
            return name;
    }
};

const TreeLeaves = ({ leaf, selectedRoomId, isFetchingContent, small, isChat }) => {
    const router = useRouter();
    const auth = useAuth();
    const matrix = useMatrix();

    const etherpad = auth.getAuthenticationProvider('etherpad');
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);
    if (!leaf) return <LoadingSpinner />;

    const roomId = leaf.id || leaf.room_id || leaf.roomId;
    const parentId = leaf.parent.id || leaf.parent.room_id || leaf.parent.roomId;
    const template = leaf.meta?.template;
    const name = isChat ? '💬 ' + leaf.name : getIcon(template, leaf.name);

    // if an iframe is open we only want to show items in the list
    if (selectedRoomId && leaf.type !== 'item') return null;

    useEffect(() => {
        let cancelled = false;
        if (template === 'etherpad' && !cancelled) {
            const checkIfPadHasPassword = async () => {
                const url = matrix.roomContents.get(roomId)?.body;
                const padId = url.split('/').pop();
                return etherpad.isPadPasswordProtected(padId);
            };

            checkIfPadHasPassword().then((isProtected) => setIsPasswordProtected(isProtected));
        }

        return () => (cancelled = true);
    }, []);

    return (
        <ServiceLink
            small={small}
            roomId={roomId}
            href={
                getConfig().publicRuntimeConfig.templates?.item.includes(template) || isChat
                    ? `/explore/${parentId}/${roomId}`
                    : `/explore/${roomId}`
            }
            name={name}
            isFetchingContent={isFetchingContent}
            selected={router.query.roomId[1] === roomId || router.query.roomId[0] === roomId}
            passwordProtected={isPasswordProtected}
        />
    );
};

export default TreeLeaves;
