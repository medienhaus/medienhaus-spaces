/**
 * This component renders a button whoch onClick opens a Modal.
 * `activeContexts` is the array of room IDs for the currently set context spaces.
 *
 * @param {string} roomId (valid matrix roomId)
 * @param {string} roomName (name of the matrix room)
 *
 * @return {React.ReactElement}
 *
 * @TODO
 * - create separate component for the invitation dialogue so it can be used without the button and maybe without the modal view.
 * - maybe swap datalist for a different UI element. datalist handling is far from optimal, since we have to manually get the userId and displayName after a user has selected the user to invite.
 *   Even though we already have it from the `matrixClient.searchUserDirectory` call. The problem is that afaik there is no way to parse the object from the <option>.
 *
 */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import styled from 'styled-components';
import { logger } from 'matrix-js-sdk/lib/logger';

import TextButton from '../TextButton';
import UserAddIcon from '../../../assets/icons/user-add.svg';
import Form from '../Form';
import { useAuth } from '../../../lib/Auth';
import CloseIcon from '../../../assets/icons/close.svg';
import ErrorMessage from '../ErrorMessage';
import { ServiceTable } from '../ServiceTable';
import UserListEntry from './UserListEntry';
import DefaultModal from '../Modal';

const Header = styled.header`
  display: grid;
  grid-template-columns: 1fr auto;
  margin-bottom: calc(var(--margin) * 2);
`;

const CloseButton = styled(TextButton)`
  /* unset globally defined button styles; set height to line-height */
  width: unset;
  height: calc(var(--margin) * 1.3);
  padding: unset;
  background-color: unset;
`;

const SearchResults = styled.div`
  height: 250px;
  overflow-y: auto;
`;

export default function InviteUserToMatrixRoom({ roomId, roomName }) {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [isInviteDialogueOpen, setIsInviteDialogueOpen] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [userFeedback, setUserFeedback] = useState('');
    const { t } = useTranslation('invitationModal');

    const handleClick = () => {
        setIsInviteDialogueOpen(prevState => !prevState);
    };

    const handleChange = (event) => {
        setSearchInput(event.target.value);
        debouncedFetchUsersForContributorSearch(event.target.value);
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

    const handleInvite = async (userId, displayName) => {
        function clearInputs() {
            setUserFeedback('');
            setSearchInput('');
            setSearchResults([]);
        }

        await matrixClient.invite(roomId, userId)
            .catch(async err => {
                // if something went wrong we display the error and clear all inputs
                setUserFeedback(<ErrorMessage>{ err.data?.error }</ErrorMessage>);
                await new Promise(() => setTimeout(() => {
                    clearInputs();
                }, 3000));

                return;
            });
        // if everything is okay, we let the user know and exit the modal view.
        setUserFeedback('✓ ' + displayName + ' ' + t('was invited and needs to accept your invitation'));
        await new Promise(() => setTimeout(() => {
            clearInputs();
            setIsInviteDialogueOpen(false);
        }, 3000));
    };

    return <>
        <button title={t('Invite users to' + ' ' + roomName)} onClick={handleClick}>
            <UserAddIcon fill="var(--color-foreground)" />
        </button>
        { isInviteDialogueOpen && (
            <DefaultModal
                isOpen={isInviteDialogueOpen}
                onRequestClose={() => setIsInviteDialogueOpen(false)}
                contentLabel="Invite Users"
                shouldCloseOnOverlayClick={true}>

                <Header>
                    { t('Invite users to') } { roomName } <CloseButton onClick={() => setIsInviteDialogueOpen(false)}>
                        <CloseIcon />
                    </CloseButton>
                </Header>
                { userFeedback ? <div>{ userFeedback }</div> :
                    <Form>
                        <input
                            type="text"
                            list="userSearch"
                            placeholder={t('user name')}
                            value={searchInput}
                            onChange={handleChange}
                            autoComplete="off"
                        />
                        <SearchResults>
                            <ServiceTable>
                                { searchResults.map((user, i) => {
                                    return <UserListEntry
                                        user={user}
                                        roomName={roomName}
                                        handleInvite={handleInvite}
                                        key={i} />;
                                }) }
                            </ServiceTable>
                        </SearchResults>
                    </Form>
                }
            </DefaultModal>
        ) }
    </>;
}
