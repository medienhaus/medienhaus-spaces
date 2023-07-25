import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { useAuth } from '../../lib/Auth';
import ManageContextActions from './ManageContextActions';

const ActionsSection = styled.div`
  height: 100%;
`;

const MenuSection = styled.div`
  & {
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
 * @param {Boolean} isCurrentUserModerator - true if the user has moderatoion rights for the currentId.
 * @TODO
 * - changing all hardcoded mod rights (50) in all files related to the 'action' component to dynamicly ones. so that it will check what the powerlevel for the intended event to send needs to be, based on the indidual specific room criterial.
*/

const ExploreMatrixActions = ({ currentId, parentId, isCurrentUserModerator, popActiveContexts }) => {
    /**
    * MATRIX
    * ------------------
    * @TODO
    * - adding functionallity of updates of the sync call. to update cached states in this component which are changed in the meantime of this session by another user.
    *   this would needs to pipe all nessesary sync informations for the currently observed id into the current room data storage (volatile).
    *   in addition to keeping track also of some specific state events of previously observed id's into the cached roomdata, for example the powerlevel's.
    */

    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    /**
    * GENERIC STATES
    * ------------------
    *
    */

    /**
    * EFFECTS
    * ------------------
    * observing if the currentId or the parentId changed. Both observed states are  parameters of this action component given by the instantiating parent compontent.
    *  currentId:   If the currentId changed some core informations about the currently observed Id will be collected.
    *  parentId:    If the parentId changed the nessesary collected information of the Id are already been stored in a cache.
    *               This function will therefore just check if the user has the rights to remove the current observed Id from the parents to enables/disables this action in the render.
    */

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) fetchRoomName();

        return () => cancelled = true;
    }, [currentId, fetchRoomName]);

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

    /**
    * FETCH FUNCTIONS
    * ------------------
    * fetch functions to get room specific informations from the current Id
    */

    const fetchRoomName = useCallback(async () => {
        const nameEvent = await matrixClient.getStateEvent(
            currentId,
            'm.room.name',
        ).catch(() => {});
        setRoomName(nameEvent?.name);

        // send also to the sessions non volatile state storage
        setCachedRoomNames({ ...cachedRoomNames, [currentId]: { name: nameEvent?.name } });
    }, [cachedRoomNames, currentId, matrixClient]);

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
            <MenuSection>
                { isCurrentUserModerator &&
                <ManageContextActions
                    currentId={currentId}
                    parentId={parentId}
                    currentName={roomName}
                /> }
            </MenuSection>

        </ActionsSection>
    );
};

export default ExploreMatrixActions;
