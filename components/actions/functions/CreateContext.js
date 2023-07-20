import React, { useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../../lib/Auth';
import TemplateSelect from './TemplateSelect';
import presets from '../presets';

const AdvancesOptions = styled.details`
  & {
    margin-bottom: var(--margin);
  }

  & select {
    margin-bottom: var(--margin);
  }
`;

const CreateContext = ({ currentId, userInfos }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [name, setName] = useState();
    const [topic, setTopic] = useState();
    const [template, setTemplate] = useState();
    const [historyVisibility, setHistoryVisibility] = useState();
    const [joinRules, setJoinRules] = useState();
    const [powerLevels, setPowerLevels] = useState();

    const [createNewContextErrorMessage, setCreateNewContextErrorMessage] = useState();

    const createContext = async (e) => {
        e.preventDefault();
        //first of all some content checking otherwise displaying custom error messages
        if (!name) {
            setCreateNewContextErrorMessage('name not set');

            return;
        }
        if (name.length < 4) {
            setCreateNewContextErrorMessage('name must have at least 4 Character');

            return;
        }
        if (!template) {
            setCreateNewContextErrorMessage('template not selected');

            return;
        }
        // topic is optional. Advanced options as well if not selected will fall back to default
        if (topic?.length > 400) {
            setCreateNewContextErrorMessage('topic too long (max 400chars)');

            return;
        }
        if (!historyVisibility) {
            setHistoryVisibility('default');

            return;
        }
        if (!joinRules) {
            setJoinRules('default');

            return;
        }
        if (!powerLevels) {
            setPowerLevels('default');

            return;
        }

        const p = _.find(presets?.allowedPowerLevelPresets, { name: powerLevels });
        const call = createMatrixRoom(
            name,
            topic,
            template,
            historyVisibility,
            joinRules,
            p?.powerLevels,
        );

        //console.log(p?.powerLevels);
        console.log(await call);
        //no error detected delete some leftovers
        setCreateNewContextErrorMessage('');
    };

    const createMatrixRoom = async (name, topic = 'a', historyVisibility, joinRules, powerLevels) => {
        const opts = {
            name: name,
            room_version: '9',
            preset: 'public_chat',
            topic: topic,
            visibility: 'public',
            creation_content: {
                type: 'm.space',
            },
            initial_state: [{
                type: 'm.room.history_visibility',
                content: { history_visibility: historyVisibility },
            },
            {
                type: 'm.room.join_rules',
                content: { join_rule: joinRules },
            }],
        };

        console.log(name);
        console.log(topic);
        console.log(historyVisibility);
        console.log(joinRules);
        console.log(powerLevels);

        const room = await matrixClient.createRoom(opts);
        const medienhausMetaEvent = {
            type: 'context',
            template: template,
            version: '0.4',
        };

        await matrixClient.sendStateEvent(room.room_id, 'dev.medienhaus.meta', medienhausMetaEvent);

        return room;
    };

    return (
        <form onSubmit={createContext}>
            <input type="text" onChange={(e) => {setName(e?.target?.value);}} value={name} required placeholder="name" />
            <input type="text" onChange={(e) => {setTopic(e?.target?.value);}} value={topic} placeholder="topic (optional)" />
            <TemplateSelect
                currentId={currentId}
                userInfos={userInfos}
                currentTemplate={setTemplate}
            />

            <AdvancesOptions>
                <summary>Advanced</summary>
                <select defaultValue={_.find(presets?.allowedHistoryVisibility, { default: true })?.name} value={historyVisibility} onChange={(e) => {setHistoryVisibility(e.target.value); }}>
                    <option value="" disabled>visibilty</option>
                    { _.map(presets?.allowedHistoryVisibility, (option, key) => {
                        return <option key={key} value={option?.name}>{ option?.display } — { option?.description }</option>;
                    }) }
                </select>
                <select defaultValue={_.find(presets?.allowedJoinRules, { default: true })?.name} value={joinRules} onChange={(e) => {setJoinRules(e.target.value);}}>
                    <option value="" disabled>join rules</option>
                    { _.map(presets?.allowedJoinRules, (option, key) => {
                        return <option key={key} value={option?.name}>{ option?.display } — { option?.description }</option>;
                    }) }
                </select>
                <select defaultValue={_.find(presets?.allowedPowerLevelPresets, { default: true })?.name} value={powerLevels} onChange={(e) => {setPowerLevels(e.target.value);}}>
                    <option value="" disabled>member participation presets</option>
                    { _.map(presets?.allowedPowerLevelPresets, (option, key) => {
                        return <option key={key} value={option?.name}>{ option?.display } — { option?.description }</option>;
                    }) }
                </select>
            </AdvancesOptions>
            { (createNewContextErrorMessage) &&
                <div>‼️ { createNewContextErrorMessage }</div> //error message container
            }
            <button type="submit">create</button>
        </form>

    );
};

export default CreateContext;
