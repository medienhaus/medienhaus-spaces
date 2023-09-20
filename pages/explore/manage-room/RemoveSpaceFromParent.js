import React, { useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../lib/Auth';
import { ServiceTable } from '../../../components/UI/ServiceTable';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import Form from '../../../components/UI/Form';
import ErrorMessage from '../../../components/UI/ErrorMessage';

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
 * Component for removing a space from its parent.
 *
 * @param {Function} children - children to display.
 * @param {String} parentId - The ID of the current observed Room.
 * @param {String} parentName - The name of the parent space.
 * @param {Function} callApiAndAddToObject - Callback function to update the list of children.
 * @param {Function} onCancel - Callback function to cancel the operation.
 * @returns {JSX.Element} JSX element representing the "Remove Space From Parent" component.
 */
const RemoveSpaceFromParent = ({
    children,
    parentId,
    parentName,
    callApiAndAddToObject,
    onCancel,
}) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const [isRemovingChild, setIsRemovingChild] = useState(false);
    const [itemsToRemove, setItemsToRemove] = useState([]);
    const [errorMessages, setErrorMessages] = useState([]);

    const { t } = useTranslation('explore');

    const removeChildFromParent = async (e) => {
        e.preventDefault();
        setIsRemovingChild(true);
        for (const roomId of itemsToRemove) {
            await matrix.removeSpaceChild(parentId, roomId)
                .catch(error => {
                    setErrorMessages(prevState => [...prevState, error.data?.error]);
                });
        }
        await callApiAndAddToObject(e, parentId);
        setItemsToRemove([]);
        setIsRemovingChild(false);
    };

    const handleSelect = (roomId) => {
        setItemsToRemove(prevState => {
            if (prevState.includes(roomId)) {
                return prevState.filter(item => item !== roomId);
            } else return [...prevState, roomId];
        });
    };
    if (!children || !matrix) return;

    return (
        <Form
            onSubmit={removeChildFromParent}>
            <RemoveSection>
                <ServiceTable>
                    { children.map(child => {
                        return <RemoveListEntry
                            child={child}
                            handleSelect={handleSelect}
                            checked={itemsToRemove.includes(child.room_id)}
                            parentName={parentName}
                        />;
                    }) }
                </ServiceTable>
                { errorMessages && errorMessages.map((errorMessage, index) => {
                    return <ErrorMessage key={index}>{ errorMessage } </ErrorMessage>;
                }) }
            </RemoveSection>

            <PreviousNextButtons
                disableNext={itemsToRemove.length === 0}
                onCancel={onCancel}>{ isRemovingChild ? <LoadingSpinnerInline inverted /> : `${t('remove') } ${itemsToRemove.length > 0 ? itemsToRemove.length : ''}` }
            </PreviousNextButtons>

        </Form>

    );
};

export default RemoveSpaceFromParent;

/**
 * Component representing a list entry for removing a child space.
 *
 * @param {Object} child - An object representing a child space containing name and room_id keys.
 * @param {Boolean} checked - Whether the child space is selected for removal.
 * @param {String} parentName - The name of the parent space.
 * @param {Function} handleSelect - Callback function to handle child space selection.
 * @returns {JSX.Element} JSX element representing a list entry for removing a child space.
 */

function RemoveListEntry({ child, parentName, handleSelect, checked }) {
    const { t } = useTranslation();

    return <ServiceTable.Row>
        <ServiceTable.Cell>{ child.name }</ServiceTable.Cell>
        <ServiceTable.Cell>
            <input type="checkbox"
                checked={checked}
                title={t('Remove {{child}} from {{parent}}', { child: child.name, parent: parentName })}
                onClick={() => handleSelect(child.room_id)} />
        </ServiceTable.Cell>
    </ServiceTable.Row>;
}

