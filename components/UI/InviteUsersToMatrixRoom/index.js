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

import Form from '../Form';
import { useAuth } from '../../../lib/Auth';
import ErrorMessage from '../ErrorMessage';
import Datalist from '../Datalist';

const InviteUserForm = styled(Form)`
  display: grid;
  align-content: start;
  justify-self: start;
  width: 100%;
  height: 100%;
  padding: var(--margin);
`;

export default function InviteUserToMatrixRoom({ roomId, roomName, onSuccess }) {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [searchResults, setSearchResults] = useState([]);
    const [userFeedback, setUserFeedback] = useState('');
    const [selectedUser, setSelectedUser] = useState();
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
            users.results.length > 0 && setSearchResults(users.results);
        } catch (err) {
            logger.error(t('Error while trying to fetch users: ') + err);
        }
    }, [matrixClient, t]);

    function clearInputs() {
        setUserFeedback('');
        setSearchResults([]);
        setSelectedUser('');
    }

    const handleInvite = async (e) => {
        e.preventDefault();

        await matrixClient.invite(roomId, selectedUser.user_id)
            .catch(async err => {
                // if something went wrong we display the error and clear all inputs
                setUserFeedback(<ErrorMessage>{ err.data?.error }</ErrorMessage>);
                await new Promise(() => setTimeout(() => {
                    clearInputs();
                }, 3000));

                return;
            });
        // if everything is okay, we let the user know and exit the modal view.
        setUserFeedback('✓ ' + selectedUser.display_name + ' ' + t('was invited and needs to accept your invitation'));
        await new Promise(() => setTimeout(() => {
            clearInputs();
            onSuccess && onSuccess();
        }, 3000));
    };

    return <>
        <InviteUserForm onSubmit={handleInvite}>
            <legend>{ t('Invite users to {{roomName}}', { roomName: roomName }) }</legend>
            { userFeedback ? <div>{ userFeedback }</div> :
                <>
                    <Datalist
                        options={searchResults}
                        onChange={handleChange}
                        keysToDisplay={['display_name', 'user_id']}
                        onSelect={setSelectedUser}
                    />
                    { selectedUser && <button>{ t('invite {{user}} to {{room}}', { user: selectedUser.display_name, room: roomName }) }</button> }
                </>
            }
        </InviteUserForm>
    </>;
}

