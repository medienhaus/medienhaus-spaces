import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

const ModSection = styled.details`
    &  {
        margin-bottom: var(--margin);
    }
    & > button {
        margin-bottom: var(--margin);
    }
`;

const UserSection = styled.details`
    &  {
        margin-bottom: var(--margin);
    }

    & > button {
        margin-bottom: var(--margin);
    }
`;

const AddOverlay = ({ currentId }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    return (
        <>
            <UserSection>
                <summary>User Section</summary>
                <button>⭐</button>
                <button>Join</button>
            </UserSection>
            <ModSection>
                <summary>Mod Section</summary>
                <button>create new substructure</button>
                <button>add existing reference</button>
            </ModSection>

        </>

    );
};

export default AddOverlay;
