/**
 * This component provides a user interface for inviting other users to a Matrix room.
 * It includes a form for searching and inviting users, and provides feedback to the user.
 *
 * @param {string} roomId - The valid Matrix room ID to which you want to invite a user.
 * @param {string} roomName - The name of the Matrix room.
 * @param {Function} onSuccess - An optional callback function to execute after a successful invitation.

 * @returns {React.ReactElement} - A React element representing the component.

 * @example
 * // Example usage of the InviteUserToMatrixRoom component:
 * <InviteUserToMatrixRoom roomId="your-room-id" roomName="Your Room" onSuccess={handleSuccess} />
 */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import { logger } from 'matrix-js-sdk/lib/logger';
import styled from 'styled-components';
import { CloseIcon } from 'next/dist/client/components/react-dev-overlay/internal/icons/CloseIcon';

import Form from '../Form';
import { useAuth } from '../../../lib/Auth';
import ErrorMessage from '../ErrorMessage';
import Datalist from '../DataList';
import { ServiceTable } from '../ServiceTable';
import TextButton from '../TextButton';

const ActionWrapper = styled.section`
  display: grid;
  align-content: start;
  justify-self: start;
  width: 100%;
  height: 100%;
  padding: 0 calc(var(--margin) *1.5) ;

  h3 {
    line-height: calc(var(--margin) *3);
  }
`;

const InviteUserForm = styled(Form)`
  display: grid;
  height: 100%;

  > :last-child {
    align-self: end;
  }
`;

export default function InviteUserToMatrixRoom({ roomId, onSuccess }) {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [searchResults, setSearchResults] = useState([]);
    const [userFeedback, setUserFeedback] = useState('');
    const [errorFeedback, setErrorFeedback] = useState();
    const [selectedUsers, setSelectedUsers] = useState([]);
    const { t } = useTranslation('invitationModal');

    const handleChange = (searchString) => {
        debouncedFetchUsersForContributorSearch(searchString);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetchUsersForContributorSearch = useCallback(debounce((val) => fetchUsersForContributorSearch(val), 300), []);

    const fetchUsersForContributorSearch = useCallback(async (a) => {
        try {
            const users = await matrixClient.searchUserDirectory({ term: a });
            // we only update the state if the returned array has entries, to be able to check if users a matrix users or not further down in the code (otherwise the array gets set to [] as soon as you selected an option from the datalist)
            // const filterResults = users.results.filter(item => _.isEqual(item, option));
            setSearchResults(users.results);
        } catch (err) {
            logger.error(t('Error while trying to fetch users: ') + err);
        }
    }, [matrixClient, t]);

    function clearInputs() {
        setUserFeedback('');
        setSearchResults([]);
        setSelectedUsers([]);
    }

    const handleInvite = async (e) => {
        e.preventDefault();
        const errors = [];

        for (const user of selectedUsers) {
            await matrixClient.invite(roomId, user.user_id)
                .catch(async err => {
                    errors.push(err);
                });
        }

        if (errors.length !== 0) {
            // if something went wrong we display the errors and clear all inputs
            setErrorFeedback(errors.map(err => <ErrorMessage key={err.data?.error}>{ err.data?.error }</ErrorMessage>));
        }

        const successAmount = selectedUsers.length - errors.length;

        // if everything is okay, we let the user know and exit the modal view.
        setUserFeedback('✓ ' + successAmount + ' ' + t('{{user}} invited and needs to accept your invitation', { user: successAmount > 1 ? 'users were' : 'user was' }));
        await new Promise(() => setTimeout(() => {
            clearInputs();
            onSuccess && successAmount === selectedUsers.length && onSuccess();
        }, 3000));
    };

    const handleUserSelect = (user) => {
        const find = selectedUsers.some(selectedUser => selectedUser?.user_id === user.user_id);
        if (find) setSelectedUsers(prevState => prevState.filter(state => state !== user));
        else setSelectedUsers(prevState => [...prevState, user]);
    };

    const handleRemove = (user) => {
        const filteredArray = selectedUsers.filter(selectedUser => selectedUser?.user_id !== user.user_id);
        setSelectedUsers(filteredArray);
    };

    return <ActionWrapper>
        <h3>{ t('Invite users') }</h3>
        <InviteUserForm onSubmit={handleInvite}>
            { userFeedback && !errorFeedback ? <div>{ userFeedback }</div> :
                <>
                    <Datalist
                        options={searchResults}
                        onChange={handleChange}
                        keysToDisplay={['display_name', 'user_id']}
                        selected={selectedUsers}
                        onSelect={handleUserSelect}
                    />
                    { /*{ selectedUsers.length !== 0 && <ServiceTable>{ selectedUsers.map(user => {*/ }
                    { /*    return <DisplaySelectedUser key={user.display_name} user={user} handleRemove={handleRemove} />;*/ }
                    { /*},*/ }
                    { /*) }*/ }
                    { /*</ServiceTable> }*/ }
                    <button disabled={selectedUsers.length === 0}>{ t('invite') }</button>
                </>
            }
            { userFeedback && errorFeedback && userFeedback }
            { errorFeedback && errorFeedback }
        </InviteUserForm>
    </ActionWrapper>;
}

const DisplaySelectedUser = ({ user, handleRemove }) => {
    return <ServiceTable.Row>
        <ServiceTable.Cell>
            { user.display_name }
        </ServiceTable.Cell>
        <ServiceTable.Cell align="right">
            <TextButton onClick={() => handleRemove(user)}>
                <CloseIcon width="var(--icon-size)" height="var(--icon-size)" fill="var(--color-foreground)" />
            </TextButton>
        </ServiceTable.Cell>
    </ServiceTable.Row>;
};
