import React from 'react';
import styled from 'styled-components';
import { t } from 'i18next';

import CreateContext from './CreateContext';
import AddExistingItem from './AddExistingItem';
// import AddExistingContext from './AddExistingContext';

const ManageContextActionsWrapper = styled.div`
  width: 100%;
  height: 100%;
`;
const ManageContextActions = ({ userInfos, parentId, currentId, currentName, setShowActions }) => {
    return <ManageContextActionsWrapper>
        <h2>{ t('Manage contexts and items within ') }{ currentName }</h2>
        <details>
            <summary>{ t('create new substructure') }</summary>
            <CreateContext currentId={currentId} parentId={parentId} userInfos={userInfos} />
        </details>
        <details>
            <summary>{ t('add existing item') }</summary>
            <AddExistingItem currentId={currentId} />
        </details>

        { /* <details>
                <summary>{ t('add existing context') }</summary>
                <AddExistingContext parentId={currentId} parentName={currentName} setShowActions={setShowActions} />
            </details>

            <details>
                <summary>{ t('add existing item from application') }</summary>
            </details> */ }

    </ManageContextActionsWrapper>;
};

export default ManageContextActions;
