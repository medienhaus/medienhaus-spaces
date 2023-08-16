import React, { useEffect, useMemo, useRef, useState } from 'react';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ApplicationSection from './ApplicationSection';

export default function Dashboard() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const invites = matrix.invites;

    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [applicationInvites, setApplicationInvites] = useState({});
    const serviceSpaces = matrix.serviceSpaces;

    const authProviders = getConfig().publicRuntimeConfig.authProviders; // get the authProvider object from the config
    const providersWithTemplates = useMemo(() => {
        return _.pickBy(authProviders, provider => _.has(provider, 'templates')); // only return authProviders which have a templates key
    }, [authProviders]);

    useEffect(() => {
        if (_.isEmpty(serviceSpaces) || !matrix.initialSyncDone) return;

        const getMetaEventAndSort = async () => {
            const allInvitations = { ...applicationInvites };
            for (const space of [...invites.values()]) {
                if (!space.meta) continue;

                Object.keys(serviceSpaces).forEach(applicationName => {
                    const applicationTemplates = providersWithTemplates[applicationName]?.templates;
                    if (!applicationTemplates) return;

                    if (applicationTemplates.includes(space.meta.template)) {
                        if (!allInvitations[applicationName]) {
                            allInvitations[applicationName] = [];
                        }

                        if (!allInvitations[applicationName].some(invitation => invitation.roomId === space.roomId)) {
                            allInvitations[applicationName].push(space);
                        }
                    }
                });
            }

            setApplicationInvites(allInvitations);
        };

        getMetaEventAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matrix.initialSyncDone, serviceSpaces, invites, providersWithTemplates]);

    // functions which interact with matrix server
    const rejectMatrixInvite = async (e, roomId, serviceName) => {
        e.preventDefault();
        console.log('rejecting ' + roomId);
        const leave = await matrixClient.leave(roomId);
        console.log(leave);
        // @TODO theoretically the applicationInvites state should be updated when accepting or rejecting an invitation since matrix.invites should change and trigger a rerender of the useEffect
        // setApplicationInvites(prevState => prevState[serviceName].filter(item => item.roomId !== roomId));
    };

    const acceptMatrixInvite = async (e, roomId, serviceName) => {
        e.preventDefault();
        await matrixClient.joinRoom(roomId).catch(() => {
            return;
        });
        // setApplicationInvites(prevState => prevState[serviceName].filter(item => item.roomId !== roomId));
    };

    return (
        <>
            <h2>/dashboard</h2>
            {
                _.map(serviceSpaces, (id, name) => {
                    return <ApplicationSection
                        key={id}
                        applicationId={id}
                        name={name}
                        invitations={applicationInvites[name]}
                        acceptMatrixInvite={acceptMatrixInvite}
                        rejectMatrixInvite={rejectMatrixInvite}

                    />;
                })
            }
        </>
    );
}

