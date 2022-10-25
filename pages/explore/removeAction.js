import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';


import CreateContext from './createContext';
import TemplateSelect from './templateSelect';

const ModSection = styled.div`
    &  {
        margin-bottom: var(--margin);
    }
    & > button {
        margin-bottom: var(--margin);
    }
`;

const UserSection = styled.div`
    &  {
        margin-bottom: var(--margin);
    }

    & > button {
        margin-bottom: var(--margin);
    }
`;

const RemoveAction = ({ currentId, parentId, userInfos }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    return (
        <>
            <p>hello :)</p>
        </>

    );
};

export default RemoveAction;
