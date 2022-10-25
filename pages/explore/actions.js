import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import SettingsAction from './settingsAction';
import InfoAction from './infoAction';
import AddAction from './addAction';
import RemoveAction from './removeAction';

const ActionsSection = styled.details`
  &  {
    margin-bottom: var(--margin);
    
  }
  & > summary {
    background-color: var(--color-fg);
    color: var(--color-bg);
    width: 50px;
    height: 35px;
    list-style: none;
    text-align: center;
    font-weight:bold;
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

    /**
    * ROOM DATA STORAGE
    * ------------------
    * states which holds all nessesarry informations about the room as single source of truth for all subcomponents.
    * this can be populated seperatatly to by user interactions and will not preload all informations at the beginnning
    * this approach was chosen instead of just getting all stateEvents of the room for performance reason as it contains a stateEvent for each user,
    * which will increase the requested pauload with a couple of thousends a lot.
    * sadly as react evolves into this weird directions, the declaration of the variables needed to be implemented like this;
    * in an non nested way, feels like written by a 5 year old.
    */

    const [roomName, setRoomName] = useState();
    const [roomTopic, setRoomTopic] = useState();
    const [roomJoinRule, setRoomJoinRule] = useState();
    const [roomPowerLevels, setRoomPowerLevels] = useState();
    const [roomMembers, setRoomMembers] = useState({ list: [], institutions: [] });
    const [roomHistoryVisibility, setRoomHistoryVisibility] = useState();
    const [roomMeta, setMetaRoom] = useState({ type: '', template: '', application: [] });

    // fetch functions to get room specific informations from the current Id
    const fetchRoomName = async () => {
        const nameEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.name',
        ).catch(() => {});
        setRoomName(nameEvent?.name);
    };
    const fetchRoomTopic = async () => {
        const topicEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.topic',
        ).catch(() => {});
        setRoomTopic(topicEvent?.topic);
    };
    const fetchRoomMembers = async () => {
        const joinedMembers = await matrixClient.getJoinedRoomMembers(currentId).catch(() => {});
        const members = { };
        members.list = _.map(joinedMembers?.joined, (member, key) => {
            return {
                id: key,
                displayname: member?.display_name,
            };
        });
        members.institutions = _.uniq(_.map(members.list, member => member?.id.split(':')[1]));
        setRoomMembers(members);
    };
    const fetchRoomJoinRule = async () => {
        const joinRulesEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.join_rules',
        ).catch(() => {});
        setRoomJoinRule(joinRulesEvent?.join_rule);
    };
    const fetchRoomHistoryVisibility = async () => {
        const historyVisibilityEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.history_visibility',
        ).catch(() => {});
        setRoomHistoryVisibility(historyVisibilityEvent?.history_visibility);
    };
    const fetchRoomPowerLevels = async () => {
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
    const fetchRoomMeta = async () => {
        const metaEvent = await matrixClient.getStateEvent(
            currentId,
            'dev.medienhaus.meta',
        ).catch(() => {});
        setMetaRoom(metaEvent);
    };
    const fetchCoreInformations = async () => {
        await fetchRoomName();
        await fetchRoomTopic();
        await fetchRoomJoinRule();
        await fetchRoomHistoryVisibility();
        await fetchRoomPowerLevels();
    };

    return (
        <ActionsSection>
            <summary>…</summary>
            <ButtonsSection>
                <button onClick={() => {setShowActions({ ...showActions, infos: !showActions.infos, add: false, settings: false, remove: false });}}> 🏷️</button>
                <button onClick={() => {setShowActions({ ...showActions, add: !showActions.add, infos: false, settings: false, remove: false });}}> 📥</button>
                <button disabled={!userInfos.mod} onClick={() => {setShowActions({ ...showActions, settings: !showActions.settings, infos: false, add: false, remove: true });}}> 📤</button>
                <button disabled={!userInfos.mod} onClick={() => {setShowActions({ ...showActions, settings: !showActions.settings, infos: false, add: false, remove: false });}}> ⚙️</button>

            </ButtonsSection>

            <MenuSection>
                { showActions.infos &&
                <InfoAction
                    userInfos={userInfos}
                    currentId={currentId}
                    members={roomMembers}
                    name={roomName}
                    topic={roomTopic}
                    join={roomJoinRule}
                    historyVisibility={roomHistoryVisibility}
                    meta={roomMeta}
                    getMembers={fetchRoomMembers}
                    getMeta={fetchRoomMeta}
                /> }
                { showActions.add && <AddAction
                    userInfos={userInfos}
                    currentId={currentId}
                /> }
                { showActions.remove && <RemoveAction
                    userInfos={userInfos}
                    currentId={currentId}
                /> }
                { showActions.settings &&
                <SettingsAction
                    userInfos={userInfos}
                    onMemberChange={fetchRoomMembers}
                    currentId={currentId}
                    name={roomName}
                    setName={setRoomName}
                    refreshName={fetchRoomName}
                    topic={roomTopic}
                    setTopic={setRoomTopic}
                    refreshTopic={fetchRoomTopic}
                    join={roomJoinRule}
                    setJoin={setRoomJoinRule}
                    refreshJoin={fetchRoomJoinRule}
                    historyVisibility={roomHistoryVisibility}
                    setHistoryVisibility={setRoomHistoryVisibility}
                    refreshHistoryVisibility={fetchRoomHistoryVisibility}
                    powerLevels={roomPowerLevels}
                    setPowerLevels={setRoomPowerLevels}
                    refreshPowerLevels={fetchRoomPowerLevels}
                    members={roomMembers}
                    setMembers={setRoomMembers}
                    refreshMembers={fetchRoomMembers}
                /> }
            </MenuSection>

        </ActionsSection>
    );
};

export default Actions;
