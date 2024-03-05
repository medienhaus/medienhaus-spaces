import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import getConfig from 'next/config';

import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ServiceLink from '../../components/UI/ServiceLink';
import { useAuth } from '@/lib/Auth';
import { useMatrix } from '@/lib/Matrix';
import logger from '@/lib/Logging';

const getIcon = (template, name) => {
    switch (template) {
        case 'etherpad':
            return '📝 ' + name;
        case 'spacedeck':
            return '🎨 ' + name;
        case 'studentproject':
            return '🎓 ' + name;
        case 'link':
            return '🔗 ' + name;
        default:
            return name;
    }
};

const TreeLeaves = ({ leaf, parentName, selectedRoomId, isFetchingContent, small, isChat, onRemove, myPowerLevel }) => {
    const router = useRouter();
    const auth = useAuth();
    const matrix = useMatrix();

    const etherpad = auth.getAuthenticationProvider('etherpad');
    const [isPasswordProtected, setIsPasswordProtected] = useState(false);

    const roomId = leaf.id || leaf.room_id || leaf.roomId;
    const parentId = leaf.parent.id || leaf.parent.room_id || leaf.parent.roomId;
    const template = leaf.meta?.template;
    const externalUrl = template === 'link' && matrix.roomContents.get(roomId)?.body;
    // if the room is a chat or service we want to show a different icon

    const name = isChat ? '💬 ' + leaf.name : getIcon(template, leaf.name);
    const href = externalUrl
        ? externalUrl
        : Object.keys(getConfig().publicRuntimeConfig.authProviders)?.includes(template) || isChat
          ? `/explore/${parentId}/${roomId}`
          : `/explore/${roomId}`;

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
                console.log(url);
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

    if (!leaf) return <LoadingSpinner />;

    // if an iframe is open we only want to show items in the list
    if (selectedRoomId && leaf.type !== 'item') return null;

    return (
        <ServiceLink
            small={small}
            roomId={roomId}
            target={template === 'link' ? '_blank' : '_self'}
            href={href}
            name={name}
            isFetchingContent={isFetchingContent}
            selected={router.query.roomId[1] === roomId || router.query.roomId[0] === roomId}
            onRemove={() => onRemove(roomId)}
            parentName={parentName}
            passwordProtected={isPasswordProtected}
            myPowerLevel={myPowerLevel}
            parentRoomId={parentId}
        />
    );
};

export default TreeLeaves;
