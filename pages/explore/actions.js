import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import SettingsAction from './settingsAction';
import InfoAction from './infoAction';
import AddAction from './addAction';

const ActionsSection = styled.details`
  &  {
    margin-bottom: var(--margin);

  }

  & > div > button {
    margin-bottom: var(--margin);
    margin-top: var(--margin);
    margin-right: var(--margin);
    width: 50px;

  }

`;

const ButtonsSection = styled.div`
  &  {
    margin-bottom: var(--margin);

  }
`;

const MenuSection = styled.div`
  &  {
    margin-bottom: var(--margin);

  }
`;

const Actions = ({ currentId }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [showActions, setShowActions] = useState({ modify: false, infos: false, add: false });

    const [stateEvents, setStateEvents] = useState();

    const [userInfos, setUserInfos] = useState({}); //stores information about the curren User

    useEffect(() => {
        getStateEvents(currentId);
    }, [currentId]);

    async function getStateEvents(roomId) { // gets the stateevents of the room
        const events = await matrixClient.roomState(roomId).catch((e) => { });
        setStateEvents(events);
        const userId = matrixClient?.credentials?.userId;
        const powerLevelsEvent = _.find(events, { type: 'm.room.power_levels' })?.content;
        const modRights = powerLevelsEvent?.users[userId] >= 50; //check if the current user got is listed with a custom power level if true and >= 50 (mod default) mod flag is set true
        setUserInfos({ ...userInfos, id: userId, mod: modRights });
    }

    return (
        <ActionsSection>
            <summary onClick={() => getStateEvents(currentId)}>…</summary>

            <ButtonsSection>
                <button onClick={() => {setShowActions({ ...showActions, infos: !showActions.infos, add: false, settings: false });}}> 🏷️</button>
                <button onClick={() => {setShowActions({ ...showActions, add: !showActions.add, infos: false, settings: false });}}> ➕</button>
                <button disabled={!userInfos.mod} onClick={() => {setShowActions({ ...showActions, settings: !showActions.settings, infos: false, add: false });}}> ⚙️</button>
            </ButtonsSection>

            <MenuSection>
                { showActions.infos && <InfoAction currentId={currentId} stateEvents={stateEvents} /> }
                { showActions.add && <AddAction userInfos={userInfos} currentId={currentId} /> }
                { showActions.settings && <SettingsAction currentId={currentId} /> }
            </MenuSection>

        </ActionsSection>

    );
};

export default Actions;
