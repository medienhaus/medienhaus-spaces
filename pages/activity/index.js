import getConfig from 'next/config';
import { useEffect, useState } from 'react';
import _ from 'lodash';

import ErrorMessage from '../../components/UI/ErrorMessage';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import Article from '../../components/activity/Article';
import Event from '../../components/activity/Event';
import Resource from '../../components/activity/Resource';

export default function Activity() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [activityArray, setActivityArray] = useState();
    const [error, setError] = useState('');

    useEffect(() => {
        // dev variables for templates
        const allowedTemplates = ['event', 'resource', 'article'];
        let cancelled = false;

        const fetchLatestActivity = async () => {
            // we collect all public rooms from the root specId
            const allRooms = await auth.getAuthenticationProvider('matrix').roomHierarchy(getConfig().publicRuntimeConfig.contextRootSpaceRoomId).catch(() => setError('Couldn\'t fetch activity feed'));
            const filteredRooms = [];

            for (const room of allRooms) {
                // then we check to see if these rooms are relevant and if so, we fetch more information.
                const roomState = await matrixClient.roomState(room.room_id);
                room.published = _.find(roomState, { type: 'm.room.create' }).origin_server_ts;

                const metaEvent = _.find(roomState, { type: 'dev.medienhaus.meta' })?.content;
                // If this space/room does not have a meta event or any of the supplied templates, we do not care about it
                if (!allowedTemplates.includes(metaEvent.template)) continue;
                // otherwise we add the metaEvent to our object
                room.metaEvent = metaEvent;

                // get displayName of creator
                const getAuthor = _.find(roomState, { type: 'm.room.create' })?.content;
                const getDisplayName = matrixClient.getUser(getAuthor.creator);
                room.author = getDisplayName.displayName;

                // try to fetch allocation data
                const allocation = _.find(roomState, { type: 'dev.medienhaus.allocation' })?.content;
                if (allocation) room.allocation = allocation;

                // if there is an avatar available we immediately convert it to a http link
                if (room.avatar_url) room.avatar_url = matrixClient.mxcUrlToHttp(room.avatar_url);

                filteredRooms.push(room);
            }

            setActivityArray(_.orderBy(filteredRooms, 'published', 'desc'));
        };

        matrix.initialSyncDone && !cancelled && fetchLatestActivity();

        return () => {
            cancelled = true;
        };
    }, [auth, matrix.initialSyncDone, matrixClient]);

    if (!activityArray) return <LoadingSpinner />;
    if (error) return <ErrorMessage>{ error }</ErrorMessage>;
    return (
        <>
            <section>
                { activityArray.map((entry) => {
                    if (entry.metaEvent.template === 'event') return <Event key={entry.room_id} activity={entry} />;
                    if (entry.metaEvent.template === 'article') return <Article key={entry.room_id} activity={entry} />;
                    if (entry.metaEvent.template === 'resource') return <Resource key={entry.room_id} activity={entry} />;
                }) }
            </section>
        </>
    );
}

