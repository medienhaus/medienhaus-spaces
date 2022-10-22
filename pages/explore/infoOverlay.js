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
        const memberEvent = _.find(stateEvents,{ type: 'm.room.member' })?.content
        const topicEvent = _.find(stateEvents,{ type: 'm.room.topic' })?.content

        const initial = {name: nameEvent?.name, topic: topicEvent?.content}
        const meta = {template: metaEvent?.template, type : metaEvent?.type, application: metaEvent?.application}

        const stateInformations = {initial : initial, meta : meta}

        setStateEventInformation({ ...stateEventInformation, meta: stateInformations.meta,initial: stateInformations.initial })


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
                            <dd>{stateEventInformation?.meta?.type}</dd>
                        <dt>Template</dt>
                            <dd>{stateEventInformation?.meta?.template}</dd>
                        <dt>Application</dt>
                            <dd>{stateEventInformation?.meta?.type}</dd>
                    </dl>
                </details>
                <details>
                    <summary>Institutions</summary>
                </details>
                <details>
                    <summary>Members</summary>
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
