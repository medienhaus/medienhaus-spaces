/**
 * Provides a user interface for inviting other users to a Matrix room.
 *
 * @param {string} roomId - The ID of the Matrix room to invite users to.
 * @param {string} roomName - The name of the Matrix room.
 * @param {Function} onSuccess - An optional callback executed after a successful invitation.
 *
 * @returns {React.ReactElement} - A React component representing the invitation UI.
 *
 * @example
 * // Example usage of the InviteUserToMatrixRoom component:
 * <InviteUserToMatrixRoom roomId="your-room-id" roomName="Your Room" onSuccess={handleSuccess} />
 */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import _, { debounce } from 'lodash';
import { logger } from 'matrix-js-sdk/lib/logger';
import styled from 'styled-components';

import { useAuth } from '../../../lib/Auth';
import ErrorMessage from '../ErrorMessage';
import Datalist from '../DataList';

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

const FeedbackWrapper = styled.div`
  margin-top: var(--margin);
`;

export default function InviteUserToMatrixRoom({ roomId, onSuccess }) {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [searchResults, setSearchResults] = useState([]);
    const [userFeedback, setUserFeedback] = useState('');
    const [errorFeedback, setErrorFeedback] = useState([]);
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
    }

    const handleInvite = async (selectedUsers) => {
        const errors = [];

        for (const user of selectedUsers) {
            await matrixClient.invite(roomId, user.user_id)
                .catch(async error => {
                    // avoid adding duplicates
                    if (errors.includes(error.data.error)) return;
                    errors.push(error.data.error);
                });
        }

        if (errors.length !== 0) {
            // if something went wrong we display the errors and clear all inputs
            setErrorFeedback(errors);
        }

        const successAmount = selectedUsers.length - errors.length;

        // if everything is okay, we let the user know and exit the view.
        setUserFeedback('✓ ' + successAmount + ' ' + t('{{user}} invited and needs to accept your invitation', { user: successAmount > 1 ? 'users were' : 'user was' }));
        await new Promise(() => setTimeout(() => {
            clearInputs();
            if (onSuccess && successAmount === selectedUsers.length) onSuccess();
        }, 3000));
    };

    return <ActionWrapper>
        <h3>{ t('Invite users') }</h3>
        { userFeedback && _.isEmpty(errorFeedback) ? <div>{ userFeedback }</div> :
            <Datalist
                options={searchResults}
                onInputChange={handleChange}
                keysToDisplay={['display_name', 'user_id']}
                onSubmit={handleInvite}
            />
        }
        <FeedbackWrapper>
            { userFeedback && errorFeedback && userFeedback }
            { !_.isEmpty(errorFeedback) && errorFeedback.map(error => <ErrorMessage key={error}>{ error }</ErrorMessage>) }
        </FeedbackWrapper>

    </ActionWrapper>;
}
