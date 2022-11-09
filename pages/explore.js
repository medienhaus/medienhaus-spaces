import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import { useTranslation } from 'react-i18next';

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
    const auth = useAuth();
    const { t } = useTranslation('explore');

    const [activeContexts, setActiveContexts] = useState([getConfig().publicRuntimeConfig.contextRootSpaceRoomId]);
    const [contents, setContents] = useState(null);

    useEffect(() => {
        const fetchContents = async () => {
            const contents = [];
            const roomHierarchy = await auth.getAuthenticationProvider('matrix').getMatrixClient().getRoomHierarchy(activeContexts[activeContexts.length - 1], undefined, 1);
            // Remove the first entry, which is the context itself
            roomHierarchy.rooms.shift();
            // Ignore `m.space.child` events that are empty
            // We're only interested in the -contents- of this context, so filter out everything that's a sub-context
            for (const room of roomHierarchy.rooms) {
                const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(room.room_id, 'dev.medienhaus.meta').catch(() => {});
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
    }, [activeContexts, auth]);

    return (
        <>
            <h2>/explore</h2>
            <ExploreSection>
                <ContextMultiLevelSelect onChange={setActiveContexts} activeContexts={activeContexts} />
                { (contents && contents.length > 0) ? (
                    <div>
                        <ol>
                            { contents.map((content) => (
                                <li>
                                    { content.name }
                                    <small>
                                        { content.type && (<> (type: <code>{ content.type }</code>)</>) }
                                        { content.template && (<> (template: <code>{ content.template }</code>)</>) }
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
