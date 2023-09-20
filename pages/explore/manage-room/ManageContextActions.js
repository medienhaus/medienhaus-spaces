import React from 'react';
import { t } from 'i18next';
import getConfig from 'next/config';

import CreateContext from './CreateContext';
import AddExistingItem from './AddExistingItem';
import AddExistingContext from './AddExistingContext';
import RemoveSpaceFromParent from './RemoveSpaceFromParent';

const ManageContextActions = ({ userInfos, parentId, currentId, currentName, children, callApiAndAddToObject }) => {
    return <>
        <h2>{ t('Manage contexts and items within ') }{ currentName }</h2>
        <details>
            <summary>{ t('create new substructure') }</summary>
            <CreateContext currentId={currentId} parentId={parentId} userInfos={userInfos} />
        </details>
        <details>
            <summary>{ t('add existing item') }</summary>
            <AddExistingItem currentId={currentId} currentName={currentName} />
        </details>

        <details>
            <summary>{ t('add existing context') }</summary>
            <AddExistingContext parentId={currentId} parentName={currentName} contextRootId={getConfig().publicRuntimeConfig.contextRootSpaceRoomId} />
        </details>
        { /*
            <details>
                <summary>{ t('add existing item from application') }</summary>
            </details> */ }

        <details>
            <summary>{ t('remove items or contexts') }</summary>
            <RemoveSpaceFromParent
                parentId={currentId}
                parentName={currentName}
                children={children}
                callApiAndAddToObject={callApiAndAddToObject} />
        </details>

    </>;
};

export default ManageContextActions;
