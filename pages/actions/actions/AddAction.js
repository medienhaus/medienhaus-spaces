import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../../lib/Auth';
import { useMatrix } from '../../../lib/Matrix';
import CreateContext from '../CreateContext';
import TemplateSelect from '../TemplateSelect';
import AddExistingContext from '../AddExistingContext';

const ModSection = styled.div`
  & {
    margin-bottom: var(--margin);
  }

  & > button {
    margin-bottom: var(--margin);
  }
`;

const UserSection = styled.div`
  & {
    margin-bottom: var(--margin);
  }

  & > button {
    margin-bottom: var(--margin);
  }
`;

/**
 * ACTIONS COMPONENT
 * ------------------
 *
 * @param {String} currentId — the Id of the current observed Room
 * @param {String} parentId — the Id of the parent of the currently observed Room. Matrix background: parentId lists currentId as an m.space.child stateevent. currentId got no information about the parentId.
 * @param {function} popActiveContexts – deletes the latest Element of the Contexts Multi Level Select Stack. Needed for the remove action.
 *
 * @TODO
 * - add item function with integration of existing application spaces, like write.
 * - add joined contexts
*/

const AddAction = ({ currentId, userInfos, mod, currentName, setShowActions }) => {
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
                        <CreateContext currentId={currentId} userInfos={userInfos} />
                    </details>

                    <details>
                        <summary>add existing context from root</summary>
                        <AddExistingContext parentId={currentId} parentName={currentName} setShowActions={setShowActions} />
                    </details>

                    <details>
                        <summary>add existing item from application</summary>
                        <></>
                    </details>

                </ModSection>
                : <></>
            }
        </>

    );
};

export default AddAction;
