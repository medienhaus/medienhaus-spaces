// This hook expects a roomId and returns an object with the last message posted to the room

import getConfig from 'next/config';
import { useState, useEffect } from 'react';

const fetchMatrix = async (roomId) => {
    const req = {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('medienhaus_access_token') },
    };

    try {
        const allMessages = getConfig().publicRuntimeConfig.authProviders.matrix.baseUrl + `/_matrix/client/r0/rooms/${roomId}/messages?limit=999999&dir=b`;
        const result = await fetch(allMessages, req);
        const data = await result.json();
        const htmlString = data.chunk.map(type => {
            if (type.type === 'm.room.message' && type.content['m.new_content'] === undefined && type.redacted_because === undefined) {
                const content = type.content;
                const bar = { ...content, ...{ eventId: type.event_id } };
                return bar;
            } else { return null; }
        },
        );
        return htmlString;
    } catch (e) {
        console.log('error from fetchFaq API call' + e);
    }
};

const useFetchCms = (path) => {
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState(false);
    const [cms, setCms] = useState([]);
    useEffect(() => {
        let canceled;
        setFetching(true);
        (async () => {
            try {
                const res = await fetchMatrix(path);
                const text = res.filter(x => x !== null);
                canceled || setCms(text);
            } catch (e) {
                canceled || setError(e);
            } finally {
                canceled || setFetching(false);
            }
        })();
        return () => { canceled = true; };
    }, [path]);

    return {
        cms,
        error,
        fetching,

    };
};
export default useFetchCms;
