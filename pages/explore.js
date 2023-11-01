import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

import ContextMultiLevelSelect from '../components/ContextMultiLevelSelect';
import { useAuth } from '../lib/Auth';

const ExploreSection = styled.div`
  & > * + * {
    margin-top: var(--margin);
  }

  & > select + select {
    margin-top: calc(var(--margin) * 0.65);
  }
`;

export default function Explore() {
    const router = useRouter();
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = matrix.getMatrixClient();
    const { t } = useTranslation('explore');

    const [activeContexts, setActiveContexts] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
    const [contents, setContents] = useState(null);

    useEffect(() => {
        const fetchContents = async () => {
            const contents = [];
            let roomHierarchy = await matrixClient.getRoomHierarchy(activeContexts[activeContexts.length - 1], undefined, 1)
                .catch(/** @param {MatrixError} error */(error) => {
                    // We only want to ignore the "M_FORBIDDEN" error, which means that our user does not have access to a certain space.
                    // In every other case this is really an unexpected error and we want to throw.
                    if (error.errcode !== 'M_FORBIDDEN') throw error;
                });
            if (!roomHierarchy) roomHierarchy = { rooms: [] };

            // Remove the first entry, which is the context itself
            roomHierarchy.rooms.shift();

            // Ignore `m.space.child` events that are empty
            // We're only interested in the -contents- of this context, so filter out everything that's a sub-context
            for (const room of roomHierarchy.rooms) {
                const metaEvent = await matrixClient.getStateEvent(room.room_id, 'dev.medienhaus.meta').catch(() => {});

                if (!metaEvent || (metaEvent && metaEvent.type !== 'context')) {
                    // This is a valid content item we want to show
                    contents.push({
                        ...room,
                        type: metaEvent?.type ?? 'chat', // If there's no meta.type we assume it's a chat room
                        template: metaEvent?.template,
                    });
                }
            }

            setContents(contents);
        };

        if (activeContexts) fetchContents();
    }, [activeContexts, matrixClient]);

    // If there's no context root space set in our configuration we can't make any use of the /explore page at
    // the moment, so we forward the user to `/`
    if (!getConfig().publicRuntimeConfig.contextRootSpaceRoomId) {
        router.replace('/');

        return null;
    }

    return (
        <>
            <h2>/explore</h2>
            <ExploreSection>
                <ContextMultiLevelSelect onChange={setActiveContexts} activeContexts={activeContexts} />
                { (contents && contents.length > 0) ? (
                    <div>
                        <ol>
                            { contents.map(({ type, template, name, room_id: roomId }) => (
                                <li key={roomId}>
                                    { name }
                                    <small>
                                        { type && (<> (type: <code>{ type }</code>)</>) }
                                        { template && (<> (template: <code>{ template }</code>)</>) }
                                    </small>
                                </li>
                            )) }
                        </ol>
                    </div>
                ) : (
                    <p>- { t('There are no contents for this context') } -</p>
                ) }
            </ExploreSection>
        </>
    );
}
