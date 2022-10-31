import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

import TemplateSelect from './TemplateSelect';
import AdvancedRoomOptions from './AdvancedRoomOptions'
import presets from './presets';


const CreateContext = ({ currentId, userInfos }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    return (
        <form>
            <input type="text" required placeholder='name'></input>
            <input type="text" placeholder='topic (optional)'></input>
            <TemplateSelect 
            currentId={currentId} 
            userInfos={userInfos} 
            templateDirectoryId={getConfig().publicRuntimeConfig.templates.context}
            />
            <details>
                <summary>Advanced</summary>
                <AdvancedRoomOptions presets={presets}/>
            </details>
            
            <button type="submit">create</button>
        </form>

    );
};

export default CreateContext;
