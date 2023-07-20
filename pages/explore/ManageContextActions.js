import React from 'react';
import styled from 'styled-components';
import { t } from 'i18next';

import CreateContext from '../../components/actions/functions/CreateContext';
import AddExistingContext from '../../components/actions/functions/AddExistingContext';

const ManageContextActionsWrapper = styled.div`
  width: 100%;
  height: 100%;
`;
const ManageContextActions = ({ userInfos, currentId, currentName, setShowActions }) => {
    return <ManageContextActionsWrapper>
        <h2>{ t('Manage contexts and items within ') }{ currentName }</h2>
        <div>
            <details>
                <summary>{ t('create new substructure') }</summary>
                <CreateContext currentId={currentId} userInfos={userInfos} />
            </details>

            <details>
                <summary>{ t('add existing context from root') }</summary>
                <AddExistingContext parentId={currentId} parentName={currentName} setShowActions={setShowActions} />
            </details>

            <details>
                <summary>{ t('add existing item from application') }</summary>
            </details>
        </div>

    </ManageContextActionsWrapper>;
};

export default ManageContextActions;
