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
import { Trans, useTranslation } from 'react-i18next';
import _, { debounce } from 'lodash';
import { logger } from 'matrix-js-sdk/lib/logger';
import { styled } from 'styled-components';
import { UserAddIcon, UserUnfollowIcon } from '@remixicons/react/line';

import ErrorMessage from '../ErrorMessage';
import Datalist from '../DataList';
import { breakpoints } from '../../_breakpoints';
import TextButton from '../TextButton';
import Icon from '../Icon';
import { useAuth } from '@/lib/Auth';

const ActionWrapper = styled.section`
    display: grid;
    align-content: start;
    justify-self: start;
    width: 100%;
    height: 100%;
    padding: 0 var(--margin);

    @media ${breakpoints.tabletAndAbove} {
        padding: 0 calc(var(--margin) * 1.5);
    }

    h3 {
        line-height: calc(var(--margin) * 3);
    }
`;

const FeedbackWrapper = styled.div`
    margin-top: var(--margin);
`;

export const InviteUserToMatrixRoom = ({ roomId, onSuccess }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [searchResults, setSearchResults] = useState([]);
    const { t } = useTranslation('invitationModal');
    const [userFeedback, setUserFeedback] = useState('');
    const [errorFeedback, setErrorFeedback] = useState([]);

    const handleChange = (searchString) => {
        debouncedFetchUsersForContributorSearch(searchString);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetchUsersForContributorSearch = useCallback(
        debounce((val) => fetchUsersForContributorSearch(val), 300),
        [],
    );

    const fetchUsersForContributorSearch = useCallback(
        async (a) => {
            try {
                const users = await matrixClient.searchUserDirectory({ term: a });
                // always filter ourselves; we most likely do not want to invite ourselves to something, i guess?!
                const usersWithoutMyself = _.filter(users.results, (user) => user.user_id !== matrixClient.getUserId());
                // we only update the state if the returned array has entries, to be able to check if users a matrix users or not further down in the code (otherwise the array gets set to [] as soon as you selected an option from the datalist)
                // const filterResults = users.results.filter(item => _.isEqual(item, option));
                setSearchResults(usersWithoutMyself);
            } catch (err) {
                logger.error(t('Error while trying to fetch users: ') + err);
            }
        },
        [matrixClient, t],
    );

    function clearInputs() {
        setUserFeedback('');
        setSearchResults([]);
    }

    const handleInvite = async (selectedUsers) => {
        setErrorFeedback([]);
        const errors = [];

        for (const user of selectedUsers) {
            await matrixClient.invite(roomId, user.user_id).catch(async (error) => {
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
        successAmount > 0 &&
            setUserFeedback(
                <Trans t={t} i18nKey="invitedUser" count={successAmount}>
                    {{ successAmount }} user was invited and needs to accept your invitation
                </Trans>,
            );
        await new Promise(() =>
            setTimeout(() => {
                clearInputs();
                if (onSuccess && successAmount === selectedUsers.length) onSuccess();
            }, 3000),
        );
    };

    return (
        <ActionWrapper>
            <h3>{t('Invite users')}</h3>
            {userFeedback && _.isEmpty(errorFeedback) ? (
                <div>{userFeedback}</div>
            ) : (
                <>
                    <Datalist
                        options={searchResults}
                        onInputChange={handleChange}
                        keysToDisplay={['display_name', 'user_id']}
                        onSubmit={handleInvite}
                    />

                    <FeedbackWrapper>
                        {userFeedback && errorFeedback && userFeedback}
                        {!_.isEmpty(errorFeedback) && errorFeedback.map((error) => <ErrorMessage key={error}>{error}</ErrorMessage>)}
                    </FeedbackWrapper>
                </>
            )}
        </ActionWrapper>
    );
};

/**
 * Button component for toggling the invitation UI for the Matrix room.
 *
 * @component
 * @param {boolean} inviteUsersOpen - Flag indicating whether the invitation UI is open.
 * @param {Function} onClick - Function to execute when the button is clicked.
 * @param {string} name - The name of the Matrix room.
 * @returns {React.ReactElement} - A React component representing the button for inviting users.
 */
const InviteUsersButton = ({ inviteUsersOpen, onClick, name }) => {
    const { t } = useTranslation('invitationModal');

    return (
        <TextButton onClick={onClick} title={t('Invite users to {{name}}', { name: name })}>
            {inviteUsersOpen ? (
                <Icon>
                    <UserUnfollowIcon />
                </Icon>
            ) : (
                <Icon>
                    <UserAddIcon />
                </Icon>
            )}
        </TextButton>
    );
};

InviteUserToMatrixRoom.Button = InviteUsersButton;
