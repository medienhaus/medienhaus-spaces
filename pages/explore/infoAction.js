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
/*
* @TODO:
* - adding routes for user interaction more -> members -> username
* - searching for referenced in sync cached rooms (fast)
* - searching for referenced in root tree (slow)
*/

const InfoAction = ({ currentId, stateEvents, userInfos }) => {
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
        const joinRulesEvent = _.find(stateEvents, { type: 'm.room.join_rules' })?.content;
        const historyVisibilityEvent = _.find(stateEvents, { type: 'm.room.history_visibility' })?.content;
        const memberEvent = _.filter(stateEvents, { type: 'm.room.member' });
        const topicEvent = _.find(stateEvents, { type: 'm.room.topic' })?.content;

        console.log(joinRulesEvent);

        const members = _.compact( //filter out empty ones
            _.map(memberEvent, member => {
                if (member?.content?.membership === 'leave') return; //check if the latest event was an leave, so the user is not a member anymore at this point
                return { id: member?.sender, displaname: member?.content?.displayname };
            }));

        const institutions = _.uniq(_.map(members, member => member?.id.split(':')[1])); //show only the tld's of the homeservers. '_.uniq' filters out duplicates

        const initial = { name: nameEvent?.name,
            topic: topicEvent?.content,
            members: members,
            join: joinRulesEvent?.join_rule,
            visibility: historyVisibilityEvent?.history_visibility
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
                    <dd>      { (() => {
                        switch (stateEventInformation?.initial?.join) {
                            case 'public':
                                return <>🌐</>;
                            case 'restricted': // is the case if is member is also member of a different specified room (aka spacemember function in element)
                                return <>🔐</>;
                            case 'knock':
                                return <>🚪</>;
                            case 'invite':
                                return <>🔒</>;
                            default:
                                return <></>;
                        }
                    })() }</dd>
                </>
                <>
                    <dt>Visibility</dt>
                    <dd>      { (() => {
                        switch (stateEventInformation?.initial?.visibility) {
                            case 'world_readable':
                                return <>🌐</>;
                            case 'shared': 
                                return <>📖</>;
                            case 'joined':
                                return <>🔐</>;
                            case 'invited':
                                return <>🔒</>;
                            default:
                                return <></>;
                        }
                    })() }</dd>
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
                                { member?.id === userInfos?.id? <>{ member?.displaname ? member?.displaname : member?.id.split(':')[0].substring(1) }</> : //checks if the user is the logged in user, to disable interaction
                                    <details>
                                        <summary>{ member?.displaname ? member?.displaname : member?.id.split(':')[0].substring(1) }</summary> { /* If Displayname is not set fallback to user id  */ }
                                        <p><a href={`#${member?.id}`}>send dm</a></p>
                                        <p><a href={`#${member?.id}`}>invite to…</a></p>
                                    </details>
                                }
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
