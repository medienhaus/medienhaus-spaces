import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

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

const AddAction = ({ currentId, userInfos }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    return (
        <>
            <UserSection>
                <button>⭐</button>
                <button>Join</button>
            </UserSection>
            { userInfos?.mod? //if no mod rights are granted for this current Id this section will not be displayed
                <ModSection>
                    <button>create new substructure</button>
                    <button>add existing reference</button>
                </ModSection>
                : <></>
            }
        </>

    );
};

export default AddAction;
