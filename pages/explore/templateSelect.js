import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

const TemplateSelect = ({ currentId }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [createNew, setCreateNew] = useState({ name: '', template: '', parent: '', interfaceError: '' }); //stores all nessesarry user input from the form
    const [generateNewTemplate, setGenerateNewTemplate] = useState(false);

    // Logics for the functions of the 'CreateSubstructureSection'
    // includes some basic input validation and dynamic form adjustments for the template selection

    const [contextTemplates, setContextTemplates] = useState([]);

    async function getTemplatesOfContexts(roomId) { // gets the templates from the
        if (contextTemplates.length > 0) return;
        const metaEvent = await auth.getAuthenticationProvider('matrix').getMatrixClient().getStateEvent(roomId, 'dev.medienhaus.meta').catch(() => {});
        if ((metaEvent?.template !== 'templates')) return;
        console.log(metaEvent);
        const roomContent = await (matrix.fetchRoomMessages(roomId, 5));
        const templates = _.uniq(roomContent?.chunk.map(entry => entry?.content?.body)).filter(e => e);
        setContextTemplates(templates);
    }

    const createNewChangeHandle = (e) => {
        if (e.target.name === 'template' && e.target.value === '_createNew') {//check if dropdown is selected for new to modify form
            e.target.value === '_createNew'? setGenerateNewTemplate(true) : setGenerateNewTemplate(false);
            setCreateNew({ ...createNew, template: '' });
            return;
        }
        if (e.target.name === 'newTemplate') {
            setCreateNew({ ...createNew, template: e.target.value });
        } else {
            setCreateNew({ ...createNew, [e.target.name]: e.target.value }); //this is the regular way if no errors occured before
        }
    };

    return (
        <>
            <select name="template" onChange={createNewChangeHandle}>
                <option value="" disabled selected>Template</option>
                { contextTemplates.map((template, key) => {
                    {/* cycle through all of the collective specified templates stored in a matrix room */}
                    return <option key={key} value={template}>
                        { template }
                    </option>;
                }) }
                <option value="_createNew">create new…</option> { /* static element for users to create a new template */ }
            </select>
            { generateNewTemplate && <input type="text" name="newTemplate" value={createNew.template} onChange={createNewChangeHandle} required placeholder="…" /> }{ /* this input is only generated if the dropwdown was selected 'create new…' */ }
        </>

    );
};

export default TemplateSelect;
