import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';

import { useAuth } from '../lib/Auth';

const ContextBrowserLevel = ({ parentSpaceRoomId, onSelect }) => {
    const auth = useAuth();
    const [selectedContext, setSelectedContext] = useState(null);
    const [childContexts, setChildContexts] = useState({});

    // Fetch all child contexts
    useEffect(() => {
        const fetchChildContexts = async () => {
            const roomHierarchy = await auth.getAuthenticationProvider('matrix').getMatrixClient().getRoomHierarchy(parentSpaceRoomId, undefined, 1);
            const rooms = roomHierarchy.rooms;
            // Remove the first entry, which is the context we retrieved the children for
            rooms.shift();
            // @TODO: Filter out spaces that aren't really contexts
            setChildContexts(rooms);
        };

        fetchChildContexts();
    }, [auth, parentSpaceRoomId]);

    if (Object.keys(childContexts).length < 1) {
        return null;
    }

    const Select = styled.select`
        margin-bottom: 5px;
    `;

    return (
        <Select
            value={selectedContext}
            onChange={(e) => {
                setSelectedContext(e.target.value);
                onSelect(parentSpaceRoomId, e.target.value);
            }}
            style={{ width: '100%' }}
        >
            <option />
            { Object.entries(childContexts).map(([key, room]) => (
                <option key={key} value={room.room_id}>
                    { room.name }
                </option>
            )) }
        </Select>
    );
};

const ContextMultiLevelSelect = ({ onChange }) => {
    // An array of the currently active context breadcrumbs
    const [activeContexts, setActiveContexts] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);

    const onSelect = (parentContextRoomId, selectedChildContextRoomId) => {
        const newActiveContexts = activeContexts.splice(0, activeContexts.findIndex((contextRoomId) => contextRoomId === parentContextRoomId) + 1);
        if (selectedChildContextRoomId) newActiveContexts.push(selectedChildContextRoomId);
        setActiveContexts(newActiveContexts);
        // Callback
        if (onChange) onChange(newActiveContexts[newActiveContexts.length - 1]);
    };

    return (
        <>
            { activeContexts.map((contextRoomId) => (
                <ContextBrowserLevel
                    key={contextRoomId}
                    onSelect={onSelect}
                    parentSpaceRoomId={contextRoomId}
                />
            )) }
        </>
    );
};

export default ContextMultiLevelSelect;
