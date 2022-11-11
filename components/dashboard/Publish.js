import _ from 'lodash';
import getConfig from 'next/config';
import { useEffect, useState } from 'react';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import { DashboardItemTemplate } from './DashboardItemTemplate';
import LoadingSpinner from '../UI/LoadingSpinner';

export default function Publish({ item }) {
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
            if (_.isEmpty(filteredRooms)) setActivityArray(null); // if filteredRooms is empty we change activityArray to null from undefined so we know, there is no content and we can stop displaying the loading spinner.
            else setActivityArray(_.orderBy(filteredRooms, 'published', 'desc'));
        };

        matrix.initialSyncDone && !cancelled && fetchLatestActivity();

        return () => {
            cancelled = true;
        };
    }, [auth, matrix.initialSyncDone, matrixClient]);

    console.log(activityArray);
    if (activityArray === undefined) return <LoadingSpinner />;
    if (activityArray === null) console.log('No activity here...');
    if (error) console.log('ERROR', { error });
    return (
        <DashboardItemTemplate notifications={item.notifications}>
            <DashboardItemTemplate.Header title={item.title} />
        </DashboardItemTemplate>
    );
}
