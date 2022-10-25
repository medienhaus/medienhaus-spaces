import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

const CreateSubstructureSection = styled.details`
  & {
    margin-bottom: var(--margin);
  }
`;

const CreateContext = ({ currentId }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();


    useEffect(() => { // basic input validation for the input fields to create a new substructure
        if (createNew.name === '' || createNew?.name.length < 4) {
            createNew.interfaceError = 'name too short';
            return;
        } else {
            createNew.interfaceError = '';
        }

        if (createNew.template === '' || createNew?.template.length < 4) {
            createNew.interfaceError = 'template name too short';
            return;
        } else {
            createNew.interfaceError = '';
        }
    }, [createNew]);

    const createContext = (e) => {
        e.preventDefault();
        if (currentId.length > 10 && currentId.charAt(0) === '!' && currentId.includes(':')) { //just some really really basic check if it could be an matrix id
            setCreateNew({ ...createNew, parent: currentId });
            console.log('created');
        } else {
            createNew.interfaceError = 'something went wrong with the selected matrix Id, please reload';
        }
    };

    return (
        <CreateSubstructureSection onClick={() => getTemplatesOfContexts(getConfig().publicRuntimeConfig.templates.context)}> { /* will only load the templates after expanding this view to prevent unnecessary network traffic */ }
            <summary>create Substructure</summary>
            <form onSubmit={createContext}>
                <input type="text" name="name" value={createNew.name} onChange={createNewChangeHandle} required placeholder="name" />

                <details>
                    <summary>advanced</summary>
                    <select>
                        <option value="" disabled selected>visibilty</option>
                    </select>
                    <select>
                        <option value="" disabled selected>join rules</option>
                    </select>
                    <select>
                        <option value="" disabled selected>member participation presets</option>
                    </select>
                </details>

                { createNew.interfaceError && <p>‼️ { createNew.interfaceError }</p> } { /* Showing the current Error to the user if some input validation failed */ }
                <button disabled={createNew.interfaceError} type="submit">create</button>
            </form>
        </CreateSubstructureSection>

    );
};

export default CreateContext;
