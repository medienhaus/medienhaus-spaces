import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../../lib/Auth';
import ContextMultiLevelSelect from '../../../components/ContextMultiLevelSelect';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import Form from '../../../components/UI/Form';
import PreviousNextButtons from '../../../components/UI/PreviousNextButtons';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';

/**
 * 'ADD EXISTING CONTEXT' COMPONENT
 *  Displays select menus for the space hierarchy of a parsed matrix room id.
 *  Users can select a 'context' and add it as a child to the parent space (parentId)
 * ------------------
 *
 * @param {String} parentId — matrix room id of the parent context
 * @param {String} parentName — name of parent
 * @param {String} contextRootId — matrix room id of the root context from where to start fetching room hierarchies. (CANNOT be selected itself)
 *
 * @TODO
 *  return name from ContextMultiLevelSelect instead of fetching it again in fetchRoomName
 *  disable other selects when fetching new children
 *
*/

const AddExistingContext = ({ parentId, parentName, contextRootId, onCancel }) => {
    const auth = useAuth();
    const matrix = auth.getAuthenticationProvider('matrix');
    const [activeContexts, setActiveContexts] = useState([contextRootId]);
    const [selectedContextName, setSelectedContextName] = useState('');
    const [isAddingAllowed, setIsAddingAllowed] = useState();
    const [errorMessage, setErrorMessage] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useTranslation('explore');

    useEffect(() => {
        const validateContextRelationship = () => {
            if (parentId && activeContexts[activeContexts.length - 1]) {
                setErrorMessage('');
                setIsAddingAllowed(true);
            } else {
                setErrorMessage(t('At least one of the contexts is not selected properly'));
                setIsAddingAllowed(false);
            }
            if (parentId && activeContexts[activeContexts.length - 1] && parentId !== activeContexts[activeContexts.length - 1]) {
                setErrorMessage('');
                setIsAddingAllowed(true);
            } else {
                setErrorMessage(t('You cannot add a context to itself.'));
                setIsAddingAllowed(false);
            }
            if (contextRootId === activeContexts[activeContexts.length - 1]) {
                setErrorMessage(t(''));
                setIsAddingAllowed(false);
            }
            if (parentId === activeContexts[activeContexts.length - 2]) {
                setErrorMessage(t('{{child}} is already part of {{parent}}', { child: selectedContextName, parent: parentName }));
                setIsAddingAllowed(false);
            }
        };
        validateContextRelationship();
    }, [activeContexts, contextRootId, parentId, parentName, selectedContextName, t]);

    const addContextToParent = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const call = await matrix.addSpaceChild(parentId, activeContexts[activeContexts.length - 1])
            .catch(error => {
                setErrorMessage(error.data?.error);

                return;
            });
        if (call?.event_id) {
            // call worked as expected
            alert(t('{{selectedContextName}} was successfully added to {{parentName}}', { selectedContextName: selectedContextName, parentName: parentName }));
            cleanUp();
        }
        setIsLoading(false);
    };

    // resetting all states back to start for a fresh new interaction.
    const cleanUp = () => {
        setActiveContexts([contextRootId]);
        setSelectedContextName('');
        setIsAddingAllowed(false);
        setErrorMessage('');
        onCancel();
    };

    return (
        <Form
            onSubmit={addContextToParent}>
            <ContextMultiLevelSelect onChange={setActiveContexts} activeContexts={activeContexts} setSelectedContextName={setSelectedContextName} />
            { selectedContextName && isAddingAllowed && <p> { t('You are about to add {{ selectedContextName }} to {{parentName}}', { selectedContextName: selectedContextName, parentName: parentName }) }</p> }
            { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
            <PreviousNextButtons
                disableNext={!isAddingAllowed}
                onCancel={cleanUp}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('add') }
            </PreviousNextButtons>
        </Form>
    );
};

export default AddExistingContext;
