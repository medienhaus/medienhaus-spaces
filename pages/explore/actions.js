import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import getConfig from 'next/config';
import _ from 'lodash';

import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';
import ModerateOverlay from './moderateOverlay';
import InfoOverlay from './infoOverlay';
import AddOverlay from './addOverlay';


const ActionsSection = styled.div`
  &  {
    margin-bottom: var(--margin);
  }

  & > button {
    margin-bottom: var(--margin);
    margin-top: var(--margin);
  }
`;

const Actions = ({ activeContexts }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();

    const [showActions, setShowActions] = useState({ modify: false, infos: false, add: false });

    return (
        <ActionsSection>
            <button onClick={() => {setShowActions({ ...showActions, infos: !showActions.infos });}}> 🏷️</button>
            { showActions.infos && <InfoOverlay currentId={activeContexts[activeContexts.length - 1]} /> }

            <button onClick={() => {setShowActions({ ...showActions, add: !showActions.add });}}> ➕</button>
            { showActions.add && <AddOverlay currentId={activeContexts[activeContexts.length - 1]} /> }

            <button onClick={() => {setShowActions({ ...showActions, modify: !showActions.modify });}}> ⚙️</button>
            { showActions.modify && <ModerateOverlay currentId={activeContexts[activeContexts.length - 1]} /> }

        </ActionsSection>

    );
};

export default Actions;
