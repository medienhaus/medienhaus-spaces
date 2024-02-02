import React, { useCallback, useEffect, useState } from 'react';
import _ from 'lodash';

import { useAuth } from '../lib/Auth';
import { useMatrix } from '../lib/Matrix';
import LoadingSpinnerInline from './UI/LoadingSpinnerInline';

const CachedContextMultiLevelSelectSingleLevel = ({ parentSpaceRoomId, selectedContextRoomId, onSelect, onFetchedChildren, templatePlaceholderMapping, templatePrefixFilter, sortAlphabetically, showTopics, rootId }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const [isLoading, setIsLoading] = useState(true);
    const [parentSpaceMetaEvent, setParentSpaceMetaEvent] = useState();
    const [childContexts, setChildContexts] = useState();

    useEffect(() => {
        let isSubscribed = true;

        // Fetch all child contexts from our storage
        const fetchChildContexts = async () => {
            let newChildContexts = [];
            const spaceCache = await matrix.spaces.get(parentSpaceRoomId) || await matrix.rooms.get(parentSpaceRoomId);
            if (!spaceCache) return;
            setParentSpaceMetaEvent(spaceCache.meta);

            for (const room of spaceCache.children) {
                const roomObject = matrix.spaces.get(room) || matrix.rooms.get(room);
                // // If this is not a context, ignore this space child
                // if (metaEvent && metaEvent.type !== 'context') continue;
                // // If we only want to show specific contexts, ignore this space child if its template doesn't have the given prefix
                if (templatePrefixFilter && roomObject.meta && !_.startsWith(roomObject.meta.template, templatePrefixFilter)) continue;
                // // ... otherwise show this space child:
                newChildContexts.push(roomObject);
            }

            if (sortAlphabetically) {
                newChildContexts = _.sortBy(newChildContexts, 'name');
            }

            if (!isSubscribed) return;
            onFetchedChildren(newChildContexts.length > 0);
            setChildContexts(newChildContexts);
        };

        const fetch = async () => {
            setIsLoading(true);
            await fetchChildContexts();
            setIsLoading(false);
        };

        fetch();

        return () => {
            isSubscribed = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matrixClient, parentSpaceRoomId, sortAlphabetically, templatePlaceholderMapping, templatePrefixFilter]);

    if (isLoading) {
        return <select key="loading" disabled><option><LoadingSpinnerInline /></option></select>;
    }

    if (!childContexts || childContexts.length < 1) {
        return null;
    }

    return (
        <select
            value={selectedContextRoomId}
            onChange={(e) => {
                onSelect(parentSpaceRoomId, e.target.value);
            }}
        >
            {
                (templatePlaceholderMapping && parentSpaceMetaEvent && templatePlaceholderMapping[parentSpaceMetaEvent.template]
                // If we have a template-specific placeholder, show that...
                    ? <option disabled value="">{ templatePlaceholderMapping[parentSpaceMetaEvent.template] }</option>
                // ... otherwise just show an empty placeholder
                    : <option disabled value="">-- select --</option>
                )
            }
            { Object.entries(childContexts).map(([key, room]) => {
                // if room is undefined we jumop to the next one
                // this can happen when for example a room was not removed as a space child from its parent but is already deleted
                if (!room) return;
                const disabled = matrix.spaces.get(rootId).children?.includes(room.roomId);

                return <option key={key} disabled={disabled} value={room.roomId}>
                    { room.name }
                    { showTopics && room.topic && (` (${room.topic})`) }
                </option>;
            }) }
        </select>
    );
};

/**
 * This component renders a multi-level <select> UI for an arbitrary set of contexts in the sense of Matrix spaces.
 * `activeContexts` is the array of room IDs for the currently set context spaces.
 *
 * @param {Array} activeContexts
 * @param {function} onChange (newActiveContexts, isLeaf)
 * @param {boolean} showTopics - If the contents of m.room.topic should be displayed in parentheses next to the name
 * @param {boolean} sortAlphabetically - If entries should be ordered alphabetically
 * @param {Object} templatePlaceholderMapping - Optional object containing placeholders for each <select> based on the `dev.medienhaus.meta.template` of the parent context
 * @param {string} templatePrefixFilter - Optional prefix to filter contexts by their templates
 * @param {string} rootId - The root context from where to start fetching room hierarchies
 *
 * @return {React.ReactElement}
 */
const CachedContextMultiLevelSelect = ({ activeContexts, onChange, showTopics, sortAlphabetically, templatePlaceholderMapping, templatePrefixFilter, rootId }) => {
    const onSelect = useCallback((parentContextRoomId, selectedChildContextRoomId) => {
        const newActiveContexts = [...activeContexts.splice(0, activeContexts.findIndex((contextRoomId) => contextRoomId === parentContextRoomId) + 1)];
        if (selectedChildContextRoomId) newActiveContexts.push(selectedChildContextRoomId);
        onChange(newActiveContexts, undefined);
    }, [activeContexts, onChange]);

    const onFinishedFetchingChildren = useCallback((hasChildren) => {
        if (onChange.length > 1) {
            onChange(activeContexts, !hasChildren);
        }
    }, [activeContexts, onChange]);

    return (
        <>
            { activeContexts && activeContexts.map((contextRoomId, i) => (
                <CachedContextMultiLevelSelectSingleLevel
                    key={contextRoomId}
                    onSelect={onSelect}
                    onFetchedChildren={onFinishedFetchingChildren}
                    parentSpaceRoomId={contextRoomId}
                    selectedContextRoomId={activeContexts[i + 1] ?? ''}
                    showTopics={showTopics}
                    sortAlphabetically={sortAlphabetically}
                    templatePlaceholderMapping={templatePlaceholderMapping}
                    templatePrefixFilter={templatePrefixFilter}
                    rootId={rootId}
                />
            )) }
        </>
    );
};

export default CachedContextMultiLevelSelect;
