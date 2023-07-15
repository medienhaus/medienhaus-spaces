import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import TemplateSelect from './functions/TemplateSelect';
import UserHandle from '../UserHandle';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import settingsPresets from './presets';

const SettingsSection = styled.div`
  & {
    margin-bottom: var(--margin);
  }

  & input,
  select {
    margin-bottom: var(--margin);
  }
`;

const MemberSection = styled.ul`
  & {
    margin-bottom: var(--margin);
  }

  & button {
    width: 50px;
  }
`;

const KickDialog = styled.div`
  & {
    margin-bottom: var(--margin);
  }
`;

/**
 * @TODO:
 * - connecting stateEvents with Sync, so if a member got kicked the State will chance automatically without an additional call.
*/

/**
 * COMPONENT 'SettingsAction'
 * Not all parameters will be explained in detail as the functionallity is quite redundant based on a simmilar naming scheme
 * @param {String} currentId — the Id of the current observed Room
 * @param {Object} userInfos — contains the informations about the current loggedIn User
 * @param {String} name – x
 * @param {function} setName – x
 * @param {async function} refreshName – x
 * …
 * setMembers is not given as the interaction with the matrix server is all been done in this compontent itself for the members
*/

const SettingsAction = ({
    currentId,
    onInfoChange,
    userInfos,
    name,
    setName,
    refreshName,
    topic,
    setTopic,
    refreshTopic,
    join,
    setJoin,
    refreshJoin,
    historyVisibility,
    sethistoryVisibility,
    refreshHistoryVisibility,
    powerLevels,
    setPowerLevels,
    refreshPowerLevels,
    members,
    refreshMembers,
}) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    /**
    * OnSave Functions
    * For all OnSaveCalled to the matrix server it doesn't matter if the content has not changed and the call is still executed
    * as matrix will return the same event_id without creating a new one if the content
    * of the Call is identical with the last event_id content.
    * So therefore no additional client side checking is absolutly nessesarry if the content has changed at all.
    */

    const onTopicSave = async () => {
        if (topic?.length < 1) return;
        const contentToSend = ''+topic;
        const call = await matrixClient.setRoomTopic(currentId, contentToSend);
        console.log(call);
        if (!call?.event_id) return;//show error and return
        await refreshName(); //refresh with the data from the server side to double ckeck as a verfication if not yet another user changed it in the meantime
        if (contentToSend !== topic) return; //show error that somethign changed in the meantime
    };

    const onNameSave = async () => {
        if (topic?.length < 1) return;
        const call = await matrixClient.setRoomTopic(currentId, topic);
        console.log(call);
        if (!call?.event_id) return;//show error and return
        await refreshName();
    };

    const [memberKickCandidate, setMemberKickCandidate] = useState();

    const kickUser = async (userId, verfify) => {
        if (verfify && memberKickCandidate) {
            await matrixClient.kick(currentId, userId).catch(e => {console.log(e);});
            console.log(userId + ' kicked!');
            setMemberKickCandidate('');
            //onInfoChange()
        }

        setMemberKickCandidate(userId);
    };

    return (
        <>
            <SettingsSection>
                <input type="text" disabled value={currentId} />
                <input type="text" placeholder="name" onChange={(e) => {setName(e.target.value);}} name="name" value={name} onBlur={onNameSave} />
                <input type="text" placeholder="topic" onChange={(e) => {setTopic(e.target.value);}} name="topic" value={topic} onBlur={onTopicSave} />
                <details>
                    <summary>advanced</summary>
                    <select>
                        <option value="" disabled selected>visibilty</option>
                        { _.map(settingsPresets?.allowedHistoryVisibility, option => {
                            return <option value={option?.name}>{ option?.display } — { option?.description }</option>;
                        }) }
                    </select>
                    <select>
                        <option value="" disabled selected>join rules</option>
                        { _.map(settingsPresets?.allowedJoinRules, option => {
                            return <option value={option?.name}>{ option?.display } — { option?.description }</option>;
                        }) }
                    </select>
                    <select>
                        <option value="" disabled selected>member participation presets</option>
                        { _.map(settingsPresets?.allowedPowerLevelPresets, option => {
                            return <option value={option?.name}>{ option?.display } — { option?.description }</option>;
                        }) }
                    </select>
                </details>
                <details onClick={members?.list?.length > 0 ? undefined : refreshMembers}>
                    <summary>members</summary>
                    <MemberSection>
                        { _.map(members?.list, (member, key) => {
                            return <li key={key}>
                                { member?.id === userInfos?.id ?
                                    <>
                                        {
                                            member?.displayname ?
                                                member?.displayname :
                                                member?.id.split(':')[0].substring(1)
                                        } (you)
                                    </>
                                    :
                                    <>
                                        <UserHandle userId={member} />
                                        <KickDialog>
                                            { memberKickCandidate !== member?.id ?
                                                <button onClick={() => kickUser(member?.id)}>❌</button>
                                                :
                                                <>
                                                    <button onClick={() => kickUser(member?.id, true)}>sure?</button>
                                                    <button onClick={() => kickUser('')}>abort!</button>
                                                </>
                                            }
                                        </KickDialog>
                                    </>
                                }
                            </li>;
                        })
                        }
                    </MemberSection>
                </details>
                <details>
                    <summary>danger zone</summary>
                    <button>delete</button>
                </details>

            </SettingsSection>

        </>

    );
};

export default SettingsAction;
