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

    const [userInfos, setUserInfos] = useState({ mod: false }); //stores information about the curren User

    useEffect(() => {
        fetchCoreInformations();
    }, [currentId]);


    /*
    * ROOM DATA STORAGE
    * ------------------
    * states which holds all nessesarry informations about the room as single source of truth for all subcomponents.
    * this can be populated seperatatly to by user interactions and will not preload all informations at the beginnning
    * this approach was chosen instead of just getting all stateEvents of the room for performance reason as it contains a stateEvent for each user,
    * which will increase the requested pauload with a couple of thousends a lot.
    * sadly as react evolves into this weird directions, the declaration of the variables, needs to be implemented like this, as been done by a 5 year old.
    */

    const [roomName, setRoomName] = useState();
    const [roomTopic, setRoomTopic] = useState();
    const [roomJoin, setRoomJoin] = useState();
    const [roomPowerLevels, setRoomPowerLevels] = useState();
    const [roomMembers, setRoomMembers] = useState({ list: [], institutions: [] });
    const [roomHistoryVisibility, setRoomHistoryVisibility] = useState();
    const [roomMeta, setMetaRoom] = useState({ type: '', template: '', application: [] });

    // fetch functions to get room specific informations from the current Id
    const fetchBasic = async () => {
        const topicEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.topic',
        ).catch(() => {});
        const nameEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.name',
        ).catch(() => {});
        setRoomName(nameEvent?.name);
        setRoomTopic(topicEvent?.topic);
    };
    const fetchMembers = async () => {
        const joinedMembers = await matrixClient.getJoinedRoomMembers(currentId).catch(() => {});
        const members = { };
        members.list = _.map(joinedMembers?.joined, (member, key) => {
            return {
                id: key,
                displayname: member?.display_name,
            };
        });
        members.institutions = _.uniq(_.map(members.list, member => member?.id.split(':')[1]));
        console.log(members);
        setRoomMembers(members);
    };
    const fetchJoinRule = async () => {
        const joinRulesEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.join_rules',
        ).catch(() => {});
        setRoomJoin(joinRulesEvent?.join_rule);
    };
    const fetchHistoryVisibility = async () => {
        const historyVisibilityEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.history_visibility',
        ).catch(() => {});
        setRoomHistoryVisibility(historyVisibilityEvent?.history_visibility);
    };
    const fetchPowerLevels = async () => {
        const userId = matrixClient?.credentials?.userId;
        const powerLevelsEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.power_levels',
        ).catch(() => {});
        const modRights = powerLevelsEvent?.users[userId] >= 50; //check if the current user got is listed with a custom power level if true and >= 50 (mod default) mod flag is set true
        setUserInfos({ ...userInfos, id: userId, mod: modRights });
        setRoomPowerLevels(powerLevelsEvent?.content);
    };

    // Custom State Events
    const fetchMeta = async () => {
        const metaEvent = await matrixClient.getStateEvent(
            currentId,
            'dev.medienhaus.meta',
        ).catch(() => {});
        setMetaRoom(metaEvent);
    };
    const fetchCoreInformations = async () => {
        await fetchBasic();
        await fetchJoinRule();
        await fetchHistoryVisibility();
        await fetchPowerLevels();
    };

    return (
        <ActionsSection>
            <button onClick={fetchPowerLevels}>bing</button>
            <summary>…</summary>
            <ButtonsSection>
                <button onClick={() => {setShowActions({ ...showActions, infos: !showActions.infos, add: false, settings: false });}}> 🏷️</button>
                <button onClick={() => {setShowActions({ ...showActions, add: !showActions.add, infos: false, settings: false });}}> ➕</button>
                <button disabled={!userInfos.mod} onClick={() => {setShowActions({ ...showActions, settings: !showActions.settings, infos: false, add: false });}}> ⚙️</button>
            </ButtonsSection>

            <MenuSection>
                { showActions.infos &&
                <InfoAction
                    userInfos={userInfos}
                    currentId={currentId}
                    members={roomMembers}
                    name={roomName}
                    topic={roomTopic}
                    join={roomJoin}
                    historyVisibility={roomHistoryVisibility}
                    meta={roomMeta}
                    getMembers={fetchMembers}
                    getMeta={fetchMeta}
                /> }
                { showActions.add && <AddAction
                    userInfos={userInfos}
                    currentId={currentId}
                /> }
                { showActions.settings &&
                <SettingsAction
                    userInfos={userInfos}
                    onMemberChange={fetchMembers}
                    currentId={currentId}
                    name={roomName}
                    topic={roomTopic}
                    join={roomJoin}
                    members={roomMembers}
                    getMembers={fetchMembers}
                    historyVisibility={roomHistoryVisibility}
                    powerLevels={roomPowerLevels}
                /> }
            </MenuSection>

        </ActionsSection>
    );
};

export default Actions;
