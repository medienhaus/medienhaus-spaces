import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

const InfoSection = styled.div`
  &  {
    margin-bottom: var(--margin);

  }

 
`;

const InfoAction = ({ currentId, stateEvents }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    useEffect(() => {
        processStateEvents(stateEvents);
    }, [stateEvents]);

    const [stateEventInformation, setStateEventInformation] = useState({});

    async function processStateEvents(stateEvents) { // gets the stateevents of the room
        const metaEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })?.content;
        const nameEvent = _.find(stateEvents, { type: 'm.room.name' })?.content;
        const joinRulesEvent = _.find(stateEvents, { type: 'dev.medienhaus.meta' })?.content;
        const memberEvent = _.filter(stateEvents, { type: 'm.room.member' });
        const topicEvent = _.find(stateEvents, { type: 'm.room.topic' })?.content;

        const members = _.compact( //filter out empty ones
            _.map(memberEvent, member => {
                if (member?.content?.membership === 'leave') return; //check if the latest event was an leave, so the user is not a member anymore at this point
                return { id: member?.sender, displaname: member?.content?.displayname };
            }));

        const institutions = _.uniq(_.map(members, member => member?.id.split(':')[1])); //show only the tld's of the homeservers. '_.uniq' filters out duplicates

        const initial = { name: nameEvent?.name,
            topic: topicEvent?.content,
            members: members,
        };
        const custom = {
            template: metaEvent?.template,
            type: metaEvent?.type,
            application: metaEvent?.application,
            institutions: institutions,
        };

        const stateInformations = { initial: initial, custom: custom };

        setStateEventInformation({ ...stateEventInformation, custom: stateInformations.custom, initial: stateInformations.initial });
    }

    return (
        <InfoSection>
            { stateEventInformation?.initial?.name ? <p>Name:{ stateEventInformation?.initial?.name }</p> : <></> }
            { stateEventInformation?.initial?.topic ? <p>Topic:{ stateEventInformation?.initial?.topic }</p> : <></> }
            <dl>
                { stateEventInformation?.initial?.name ? <>
                    <dt>Name</dt>
                    <dd>{ stateEventInformation?.initial?.name }</dd>
                </>
                    : <></> }
                { stateEventInformation?.initial?.topic ? <>
                    <dt>Topic</dt>
                    <dd>{ stateEventInformation?.initial?.topic }</dd>
                </>
                    : <></> }
                <>
                    <dt>Join Rules</dt>
                    <dd>{ stateEventInformation?.join }</dd>
                </>
                <>
                    <dt>Visibility</dt>
                    <dd>{ stateEventInformation?.visibilty }</dd>
                </>
            </dl>
            <details>
                <summary>more</summary>
                <p>Id: <span>{ currentId }</span></p>
                <details>
                    <summary>meta</summary>
                    <dl>
                        <dt>Application</dt>
                        <dd>{ stateEventInformation?.custom?.type }</dd>
                        <dt>Type</dt>
                        <dd>{ stateEventInformation?.custom?.type }</dd>
                        <dt>Template</dt>
                        <dd>{ stateEventInformation?.custom?.template }</dd>
                    </dl>
                </details>
                <details>
                    <summary>Institutions</summary>
                    <ul>
                        { _.map(stateEventInformation?.custom?.institutions, (institution, key) => {
                            return <li key={key}>{ institution }</li>;
                        }) }
                    </ul>

                </details>
                <details>
                    <summary>Members</summary>
                    <ul>
                        { _.map(stateEventInformation?.initial?.members, (member, key) => {
                            return <li key={key}>
                                <details>
                                    <summary>{ member?.displaname ? member?.displaname : member?.id.split(':')[0].substring(1) }</summary> { /* If Displayname is not set fallback to user id  */ }
                                    <p><a href={`#${member?.id}`}>send dm</a></p>
                                    <p><a href={`#${member?.id}`}>invite to…</a></p>
                                </details>
                            </li>;
                        })
                        }
                    </ul>
                </details>
                <details>
                    <summary>Referenced</summary>
                </details>

            </details>
        </InfoSection>

    );
};

export default InfoAction;
