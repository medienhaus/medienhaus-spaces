import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/Auth';
import { ServiceTable } from '../../components/UI/ServiceTable';
import EraserIcon from '../../assets/icons/eraser.svg';
import TextButton from '../../components/UI/TextButton';
import LoadingSpinnerInline from '../../components/UI/LoadingSpinnerInline';

const RemoveSection = styled.div`
  & {
    margin-bottom: var(--margin);
  }

  & > button {
    width: 150px;
    margin-right: var(--margin);
    margin-bottom: var(--margin);
  }

  & span:first-of-type {
    background-color: var(--color-hi);
  }
`;

/**
 * COMPONENT 'RemoveAction'
 *
 * @TODO
 *
 * @param {String} parentId — the Id of the current observed Room
 * @param {String} parentName – x
 * @param {function} activeAction – x
 * @callback callApiAndAddToObject
*/

const RemoveSpaceFromParent = ({
    parentId,
    parentName,
    children,
    callApiAndAddToObject,
}) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const [isRemovingChild, setIsRemovingChild] = useState(false);

    const { t } = useTranslation('explore');

    const removeChildFromParent = async (e, name, roomId) => {
        setIsRemovingChild(true);
        const deleteDialogue = confirm(t('Are you sure you want to remove {{child}} from {{parent}}', { child: name, parent: parentName }));
        if (deleteDialogue) {
            const call = await matrix.removeSpaceChild(parentId, roomId)
                .catch(error => {
                    alert(error.data?.error);
                });
            if (call?.event_id) { //if an event_id is provided as an response the call were accepted and the currentId removed from the parentId as a m.room.spaceChild
                await callApiAndAddToObject(e, parentId);
            }
        }
        setIsRemovingChild(false);
    };

    if (!children || !matrix) return;

    return (
        <>
            <RemoveSection>
                <ServiceTable>
                    { children.map(child => {
                        return <RemoveListEntry
                            child={child}
                            isRemovingChild={isRemovingChild}
                            removeChildFromParent={removeChildFromParent}
                            parentName={parentName}
                        />;
                    }) }
                </ServiceTable>
            </RemoveSection>

        </>

    );
};

export default RemoveSpaceFromParent;

/**
 * Description placeholder
 *
 * @param {Object} child - object of child containing name and room_id keys
 * @param {Boolean} isRemovingChild
 * @param {String} parentName - name of parent space
 * @callback removeChildFromParent
 *   @param {Event} e
 *   @param {String} name
 *   @param {String} roomId - matrix room id of room to remove
 * @returns {React.ReactComponent}
 */

function RemoveListEntry({ child, isRemovingChild, parentName, removeChildFromParent }) {
    const [isDeletingCurrentChild, setIsDeletingCurrentChild] = useState(false);
    const { t } = useTranslation();

    const handleClick = async (e) => {
        e.preventDefault();
        setIsDeletingCurrentChild(true);
        await removeChildFromParent(e, child.name, child.room_id);
        setIsDeletingCurrentChild(false);
    };

    return <ServiceTable.Row>
        <ServiceTable.Cell>{ child.name }</ServiceTable.Cell>
        <ServiceTable.Cell>
            <TextButton
                disabled={isRemovingChild}
                onClick={(e) => handleClick(e)}
                title={t('Remove {{child}} from {{parent}}', { child: child.name, parent: parentName })}>
                { isDeletingCurrentChild ?
                    <LoadingSpinnerInline /> :
                    <EraserIcon fill="var(--color-foreground)" /> }
            </TextButton>
        </ServiceTable.Cell>
    </ServiceTable.Row>;
}

