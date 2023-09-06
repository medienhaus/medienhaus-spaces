import React from 'react';
import { t } from 'i18next';
import getConfig from 'next/config';

import CreateContext from './CreateContext';
import AddExistingItem from './AddExistingItem';
import AddExistingContext from './AddExistingContext';

const ManageContextActions = ({ userInfos, parentId, currentId, currentName, setShowActions }) => {
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

    </>;
};

export default ManageContextActions;
