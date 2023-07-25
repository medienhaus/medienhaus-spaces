import React, { useState } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import getConfig from 'next/config';

import { useAuth } from '../../lib/Auth';
import TemplateSelect from './TemplateSelect';
import presets from './oldactions/presets';
import { useMatrix } from '../../lib/Matrix';
import ErrorMessage from '../../components/UI/ErrorMessage';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AdvancesOptions = styled.details`
  & {
    margin-bottom: var(--margin);
  }

  & select {
    margin-bottom: var(--margin);
  }
`;

const CreateContext = ({ currentId, parentId, userInfos }) => {
    const auth = useAuth();
    const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));

    const [name, setName] = useState();
    const [topic, setTopic] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const [template, setTemplate] = useState();
    const [historyVisibility, setHistoryVisibility] = useState();
    const [joinRule, setJoinRule] = useState();
    const [powerLevels, setPowerLevels] = useState();

    const [createNewContextErrorMessage, setCreateNewContextErrorMessage] = useState();

    const createContext = async (e) => {
        e.preventDefault();
        //first of all some content checking otherwise displaying custom error messages
        setIsLoading(true);
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
        // if (topic?.length > 400) {
        //     setCreateNewContextErrorMessage('topic too long (max 400chars)');

        //     return;
        // }

        if (!powerLevels) {
            setPowerLevels('default');
        }
        // create the new context space
        const createNewSubContext = await matrix.createRoom(name,
            true,
            topic,
            joinRule || 'public',
            'context',
            template,
            getConfig().publicRuntimeConfig.name,
            'public',
            historyVisibility,
            'public_chat').catch(async (err) => {
            setCreateNewContextErrorMessage(err.message);
            await new Promise(r => setTimeout(r, 3000));
            setCreateNewContextErrorMessage('');
        });

        // then add our new context to the parent.
        if (createNewSubContext) {
            auth.getAuthenticationProvider('matrix').addSpaceChild(currentId, createNewSubContext).catch(async (err) => {
                setCreateNewContextErrorMessage(err.message);
                await new Promise(r => setTimeout(r, 3000));
                setCreateNewContextErrorMessage('');
            },

            );
        }
        setName('');
        setTopic('');
        setTemplate('');
        setIsLoading(false);
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
                <select defaultValue={_.find(presets?.allowedJoinRules, { default: true })?.name} value={joinRule} onChange={(e) => {setJoinRule(e.target.value);}}>
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
                <ErrorMessage>{ createNewContextErrorMessage }</ErrorMessage> //error message container
            }
            <button disabled={isLoading || !name || !template} type="submit">{ isLoading ? <LoadingSpinner inverted /> : 'create' }</button>
        </form>

    );
};

export default CreateContext;
