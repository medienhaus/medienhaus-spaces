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

/**
 * ACTIONS COMPONENT
 * ------------------
 *
 * @param {String} currentId — the Id of the current observed Room
 * @param {String} parentId — the Id of the parent of the currently observed Room. Matrix background: parentId lists currentId as an m.space.child stateevent. currentId got no information about the parentId.
 * @param {function} popActiveContexts – deletes the latest Element of the Contexts Multi Level Select Stack. Needed for the remove action.
 *
*/

const Actions = ({ currentId, parentId, popActiveContexts }) => {
    /**
    * MATRIX
    * ------------------
    * @TODO
    * - adding functionallity of updates of the sync call. to update cached states in this component which are changed in the meantime of this session by another user.
    *   this would needs to pipe all nessesary sync informations for the currently observed id into the current room data storage (volatile).
    *   in addition to keeping track also of some specific state events of previously observed id's into the cached roomdata, for example the powerlevel's.
    */

    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    /**
    * GENERIC STATES
    * ------------------
    *
    */

    const [showActions, setShowActions] = useState();
    const [userInfos, setUserInfos] = useState(); //stores information about the curren User

    const [userCurrentIdMod, setUserCurrentIdMod] = useState(false);
    const [userParentIdMod, setParentIdMod] = useState(false);

    /**
    * EFFECTS
    * ------------------
    * observing if the currentId or the parentId changed. Both observed states are  parameters of this action component given by the instantiating parent compontent.
    *  currentId:   If the currentId changed some core informations about the currently observed Id will be collected.
    *  parentId:    If the parentId changed the nessesary collected information of the Id are already been stored in a cache.
    *               This function will therefore just check if the user has the rights to remove the current observed Id from the parents to enables/disables this action in the render.
    */

    useEffect(() => {
        fetchRoomName();
        fetchRoomTopic();
        fetchRoomJoinRule();
        fetchRoomHistoryVisibility();
        fetchRoomPowerLevels();
    }, [currentId]);

    useEffect(() => {
        if (parentId) {
            const parentPowerLevel = cachedRoomPowerLevels?.[parentId]?.powerLevels;
            if (!parentPowerLevel) {
                /** if a parentId exists but there is no cached record of the PowerLevel no parentMod rights are accesible to check and therefor set it to false.
                * @TODO
                * - could become a problem in the future if the ContextMulitLevelSelect Component will have the ability to start not from the root of the tree, so therefore the parent Events are not cached.
                */
                setParentIdMod(false);
                return;
            }
            setParentIdMod(parentPowerLevel?.users[userInfos?.id] >= 50);
        }
    }, [parentId]);

    /**
    * CURRENT ROOM DATA STORAGE (VOLATILE)
    * ------------------
    * states which holds all nessesarry informations about the room as single source of truth for all subcomponents.
    * this can be populated seperatatly to by user interactions and will not preload all informations at the beginnning
    * this approach was chosen instead of just getting all stateEvents of the room for performance reason as it contains a stateEvent for each user,
    * which will increase the requested pauload with a couple of thousends a lot.
    * sadly as react evolves into this weird directions, the declaration of the variables needed to be implemented like this:
    * not in a nested way; feels like written by a 5 year old.
    */

    const [roomName, setRoomName] = useState();
    const [roomTopic, setRoomTopic] = useState();
    const [roomJoinRule, setRoomJoinRule] = useState();
    const [roomPowerLevels, setRoomPowerLevels] = useState();
    const [roomMembers, setRoomMembers] = useState({ list: [], institutions: [] });
    const [roomHistoryVisibility, setRoomHistoryVisibility] = useState();
    const [roomMeta, setMetaRoom] = useState({ type: '', template: '', application: [] });

    /**
    * ALL ROOM DATA STORAGE (SESSION NON VOLATILE)
    * ------------------
    * the following states keeps a cached copy of some specific state events  which are already requested from the matrix server to use them later in an different usecase again to prevent the need for an additional call.
    * The current usecase for which this is needed is to check the interactions with a parent id to remove spaces from an  previously viewed id.
    *
    * @TODO
    * - still needs to be discussed how to deal with edgecases like: an additional user renames an space or changes the power levels in the meantime.
    *   could be prevented if data from a sync is piped in this storage as well to keep them always up to date.
    */

    const [cachedRoomNames, setCachedRoomNames] = useState({});
    const [cachedRoomPowerLevels, setCachedRoomPowerLevels] = useState({});

    /**
    * FETCH FUNCTIONS
    * ------------------
    * fetch functions to get room specific informations from the current Id
    */

    const fetchRoomName = async () => {
        const nameEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.name',
        ).catch(() => {});
        setRoomName(nameEvent?.name);

        // send also to the sessions non volatile state storage
        setCachedRoomNames({ ...cachedRoomNames, [currentId]: { name: nameEvent?.name } });
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
        //  insitutions just holds the names of the matrix homeservers which the joined members orignated from.
        //  will become more relevant in the future if federatable networks will be implemented. for now its just an non interactive list of strings
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
        setUserCurrentIdMod(powerLevelsEvent?.users[userId] >= 50);  //check if the current user got is listed with a custom power level if true and >= 50 (mod default) mod flag is set true
        setRoomPowerLevels(powerLevelsEvent);
        setUserInfos({ ...userInfos, id: userId });

        // send also to the sessions non volatile state storage
        setCachedRoomPowerLevels({ ...cachedRoomPowerLevels, [currentId]: { powerLevels: powerLevelsEvent } });
    };

    const fetchRoomMeta = async () => {
        const metaEvent = await matrixClient.getStateEvent(
            currentId,
            'dev.medienhaus.meta',
        ).catch(() => {});
        setMetaRoom(metaEvent);
    };

    /**
    * RENDER
    * ------------------
    *
    *                   | 'ButtonSection'
    * 'ActionSection'->
    *                   | 'MenuSection' --->| 'InfoAction'
    *                                   --->| 'AddAction'
    *                                   --->| 'RemoveAction'
    *                                   --->| 'SettingsAction'
    *
    * 'ActionSection'   acts as an wrapper all of the possible functions
    * 'ButtonSection'   contains the possible actions which the user can execute, not allowed functiosn for the currently observed Id are disabled.
    *                   for now the following functions are accessable:
    *                       'info' -> read rights required
    *                       'add' -> mod rights mostly required
    *                       'remove' -> mod rights of the parentId required
    *                       'settings' -> mod/admin rights required
    * 'MenuSection'     contains the actual user interfaces for the specific action
    */

    return (
        <ActionsSection>
            <summary>…</summary>
            <ButtonsSection>
                <button onClick={() => {setShowActions(() => showActions === 'info' ? '' : 'info');}}> 🏷️</button>
                <button onClick={() => {setShowActions(() => showActions === 'add' ? '' : 'add');}}> 📥</button>
                <button disabled={!userParentIdMod} onClick={() => {setShowActions(() => showActions === 'remove' ? '' : 'remove');}}> 📤</button>
                <button disabled={!userCurrentIdMod} onClick={() => {setShowActions(() => showActions === 'settings' ? '' : 'settings');}}> ⚙️</button>
            </ButtonsSection>

            <MenuSection>
                { showActions === 'info' && //checks if this action got active via a button user input before rendering this component.
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
                { showActions === 'add' &&
                <AddAction
                    userInfos={userInfos}
                    currentId={currentId}
                    mod={userCurrentIdMod}
                    currentName={roomName}
                    setShowActions={setShowActions}
                /> }
                { showActions === 'remove' &&
                <RemoveAction
                    userInfos={userInfos}
                    currentId={currentId}
                    parentId={parentId}
                    setShowActions={setShowActions}
                    showActions={showActions}
                    name={roomName}
                    activeAction={showActions}
                    popActiveContexts={popActiveContexts}
                /> }
                { showActions === 'settings' &&
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
