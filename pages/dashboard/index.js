import React, { useEffect, useMemo, useRef, useState } from 'react';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ApplicationSection from './ApplicationSection';

export default function Dashboard() {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    const invites = useMemo(() => [...matrix.invites.values()], [matrix.invites]);

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

            for (const space of invites) {
                const meta = await matrixClient.http.authedRequest('GET', `/rooms/${space.roomId}/state/dev.medienhaus.meta`, {}, undefined, {});
                if (!meta) continue;

                Object.keys(serviceSpaces).forEach(applicationName => {
                    const applicationTemplates = providersWithTemplates[applicationName]?.templates;
                    if (!applicationTemplates) return;

                    if (applicationTemplates.includes(meta.template)) {
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
    }, [matrix.initialSyncDone, matrixClient.http, serviceSpaces, invites, providersWithTemplates]);

    // functions which interact with matrix server
    const rejectMatrixInvite = async (e, roomId) => {
        e.preventDefault();
        await matrixClient.leave(roomId);
        setApplicationInvites(prevState => _.remove(prevState, (c) => {return c.roomId === roomId; }));
    };

    const acceptMatrixInvite = async (e, roomId) => {
        e.preventDefault();
        await matrixClient.joinRoom(roomId);
        _.remove(applicationInvites, (c) => {return c.roomId === roomId; });
    };

    return (
        <>
            <h2>/dashboard</h2>
            {
                _.map(serviceSpaces, (id, name) => {
                    if (!applicationInvites[name]) return null; // if there is no key fot the space within the invitation object. We
                    console.log(name);

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

