import React, { useCallback, useEffect, useState } from "react";
import _ from "lodash";

import { useAuth } from "../lib/Auth";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/UI/select";

const ContextMultiLevelSelectSingleLevel = ({
    parentSpaceRoomId,
    selectedContextRoomId,
    onSelect,
    onFetchedChildren,
    templatePlaceholderMapping,
    templatePrefixFilter,
    sortAlphabetically,
    showTopics,
}) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider("matrix");
    const matrixClient = matrix.getMatrixClient();
    const [isLoading, setIsLoading] = useState(true);
    const [parentSpaceMetaEvent, setParentSpaceMetaEvent] = useState();
    const [childContexts, setChildContexts] = useState();

    useEffect(() => {
        let isSubscribed = true;

        // Fetch meta event of the parent space
        const fetchMetaEvent = async () => {
            const metaEvent = await matrixClient
                .getStateEvent(parentSpaceRoomId, "dev.medienhaus.meta")
                .catch(() => {});
            isSubscribed && setParentSpaceMetaEvent(metaEvent);
        };

        // Fetch all child contexts
        const fetchChildContexts = async () => {
            let newChildContexts = [];
            let roomHierarchy = await matrixClient
                .getRoomHierarchy(parentSpaceRoomId, undefined, 1)
                .catch(
                    /** @param {MatrixError} error */ (error) => {
                        // We only want to ignore the "M_FORBIDDEN" error, which means that our user does not have access to a certain space.
                        // In every other case this is really an unexpected error and we want to throw.
                        if (error.errcode !== "M_FORBIDDEN") throw error;
                    },
                );
            if (!roomHierarchy) roomHierarchy = { rooms: [] };

            // Remove the first entry, which is the context we retrieved the children for
            roomHierarchy.rooms.shift();

            // Ensure we're looking at contexts, and not spaces/rooms of other types
            for (const room of roomHierarchy.rooms) {
                const metaEvent = await matrixClient
                    .getStateEvent(room.room_id, "dev.medienhaus.meta")
                    .catch(() => {});
                // If this space/room does not have a meta event we do not care about it
                if (!metaEvent) continue;
                // If this is not a context, ignore this space child
                if (metaEvent && metaEvent.type !== "context") continue;
                // If we only want to show specific contexts, ignore this space child if its template doesn't have the given prefix
                if (
                    templatePrefixFilter &&
                    metaEvent &&
                    !_.startsWith(metaEvent.template, templatePrefixFilter)
                )
                    continue;
                // ... otherwise show this space child:
                newChildContexts.push(room);
            }

            if (sortAlphabetically) {
                newChildContexts = _.sortBy(newChildContexts, "name");
            }

            if (!isSubscribed) return;
            onFetchedChildren(newChildContexts.length > 0);
            setChildContexts(newChildContexts);
        };

        const fetch = async () => {
            setIsLoading(true);
            if (templatePlaceholderMapping) await fetchMetaEvent();
            await fetchChildContexts();
            setIsLoading(false);
        };

        fetch();

        return () => {
            isSubscribed = false;
        };
        // Do not list `onFetchedChildren` as a dependency because for some reason that will keep re-rendering this component.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        matrixClient,
        parentSpaceRoomId,
        sortAlphabetically,
        templatePlaceholderMapping,
        templatePrefixFilter,
    ]);

    if (isLoading) {
        return (
            <Select key='loading' disabled>
                <SelectContent>loading...</SelectContent>
            </Select>
        );
    }

    if (childContexts.length < 1) {
        return null;
    }

    return (
        <Select
            defaultValue={selectedContextRoomId}
            onValueChange={(value) => {
                onSelect(parentSpaceRoomId, value);
            }}
        >
            <SelectTrigger>
                <SelectValue placeholder='-- choose option --' />
            </SelectTrigger>
            <SelectContent>
                {templatePlaceholderMapping &&
                parentSpaceMetaEvent &&
                templatePlaceholderMapping[parentSpaceMetaEvent.template] ? (
                    // If we have a template-specific placeholder, show that...
                    <SelectItem disabled value={parentSpaceMetaEvent.template}>
                        {
                            templatePlaceholderMapping[
                                parentSpaceMetaEvent.template
                            ]
                        }
                    </SelectItem>
                ) : (
                    // ... otherwise just show an empty placeholder
                    <SelectItem disabled value='-' />
                )}
                {Object.entries(childContexts).map(([key, room]) => (
                    <SelectItem key={key} value={room.room_id}>
                        {room.name}
                        {showTopics && room.topic && ` (${room.topic})`}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
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
 *
 * @return {React.ReactNode}
 */
const ContextMultiLevelSelect = ({
    activeContexts,
    onChange,
    showTopics,
    sortAlphabetically,
    templatePlaceholderMapping,
    templatePrefixFilter,
}) => {
    const onSelect = useCallback(
        (parentContextRoomId, selectedChildContextRoomId) => {
            const newActiveContexts = [
                ...activeContexts.splice(
                    0,
                    activeContexts.findIndex(
                        (contextRoomId) =>
                            contextRoomId === parentContextRoomId,
                    ) + 1,
                ),
            ];
            if (selectedChildContextRoomId)
                newActiveContexts.push(selectedChildContextRoomId);
            onChange(newActiveContexts, undefined);
        },
        [activeContexts, onChange],
    );

    const onFinishedFetchingChildren = useCallback(
        (hasChildren) => {
            if (onChange.length > 1) {
                onChange(activeContexts, !hasChildren);
            }
        },
        [activeContexts, onChange],
    );

    return (
        <>
            {activeContexts &&
                activeContexts.map((contextRoomId, i) => (
                    <ContextMultiLevelSelectSingleLevel
                        key={contextRoomId}
                        onSelect={onSelect}
                        onFetchedChildren={onFinishedFetchingChildren}
                        parentSpaceRoomId={contextRoomId}
                        selectedContextRoomId={activeContexts[i + 1] ?? ""}
                        showTopics={showTopics}
                        sortAlphabetically={sortAlphabetically}
                        templatePlaceholderMapping={templatePlaceholderMapping}
                        templatePrefixFilter={templatePrefixFilter}
                    />
                ))}
        </>
    );
};

export default ContextMultiLevelSelect;
