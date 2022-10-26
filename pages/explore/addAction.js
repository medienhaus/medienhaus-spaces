import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import CreateContext from './createContext';
import TemplateSelect from './templateSelect';
import AddExistingContext from './AddExistingContext';

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

const AddAction = ({ currentId, userInfos, mod, currentName,setShowActions }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    return (
        <>
            <UserSection>
                <button>⭐</button>
                <button>Join</button>
            </UserSection>
            { mod? //if no mod rights are granted for this current Id this section will not be displayed
                <ModSection>
                    <details>
                        <summary>create new substructure</summary>
                        <CreateContext />
                    </details>

                    <details>
                        <summary>add existing context from root</summary>
                        <AddExistingContext parentId={currentId} parentName={currentName} setShowActions={setShowActions} />
                    </details>

                </ModSection>
                : <></>
            }
        </>

    );
};

export default AddAction;
