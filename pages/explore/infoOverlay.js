import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';




const InfoOverlay = ({currentId }) => {

    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix')
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();


    useEffect(() => { 
        getStateEvents(currentId)

    }, [currentId]);


    const [stateEventInformation,setStateEventInformation] = useState({})


    async function getStateEvents(roomId) { // gets the stateevents of the room
        const stateEvents = await matrixClient.roomState(roomId).catch((e) => {  })
        const metaEvent = _.find(stateEvents,{ type: 'dev.medienhaus.meta' })?.content
        const nameEvent = _.find(stateEvents,{ type: 'm.room.name' })?.content
        const joinRulesEvent = _.find(stateEvents,{ type: 'dev.medienhaus.meta' })?.content
        const memberEvent = _.filter(stateEvents,{ type: 'm.room.member' })
        const topicEvent = _.find(stateEvents,{ type: 'm.room.topic' })?.content

        const members = _.omitBy(_.map(memberEvent,member => {
            if(member?.content.membership === 'join'){
                return {id:member?.sender,displaname:member?.content?.displayname}
            }
        }), _.isNil)
        const institutions = _.omitBy(_.map(members, member => member?.id.split(':')[1]), _.isNil)


        const initial = {name: nameEvent?.name, topic: topicEvent?.content,members:members}
        const custom = {template: metaEvent?.template, type : metaEvent?.type, application: metaEvent?.application}

        const stateInformations = {initial : initial, custom : custom}

        setStateEventInformation({ ...stateEventInformation, custom: stateInformations.custom, initial: stateInformations.initial })



    }



    return (
        <>
            <p>Name:{stateEventInformation?.initial?.name}</p>
            <p>Topic:{stateEventInformation?.initial?.topic}</p>
            <details>
                <summary>more</summary>
                <p>Id: <span>{currentId}</span></p>
                <details>
                    <summary>meta</summary>
                    <dl>
                        <dt>Type</dt>
                            <dd>{stateEventInformation?.custom?.type}</dd>
                        <dt>Template</dt>
                            <dd>{stateEventInformation?.custom?.template}</dd>
                        <dt>Application</dt>
                            <dd>{stateEventInformation?.custom?.type}</dd>
                    </dl>
                </details>
                <details>
                    <summary>Institutions</summary>
                    <p>{stateEventInformation?.custom?.institutions}</p>
                </details>
                <details>
                    <summary>Members</summary>
                    <ul>
                    {_.map(stateEventInformation?.initial?.members, (member) =>  { 
                        return  <details>
                            <summary>{member?.displaname}</summary>
                            <p><a href={ `#${member?.id}` }>send dm</a></p>
                            <p><a href={ `#${member?.id}` }>invite to…</a></p>
                            </details>
                    })
                    }
                    </ul>
                </details>
                <details>
                    <summary>Referenced</summary>
                </details>
                <dl>
                        <dt>Join Rules</dt>
                            <dd>{stateEventInformation?.join}</dd>
                        <dt>Visibility</dt>
                            <dd>{stateEventInformation?.visibilty}</dd>
                    </dl>
            </details>
            

            <button>⭐</button>
            <button>Join</button>


        </>
        
    );
};

export default InfoOverlay;
