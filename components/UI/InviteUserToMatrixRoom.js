import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import Modal from 'react-modal';
import styled from 'styled-components';

import TextButton from '../UI/TextButton';
import UserAddIcon from '../../assets/icons/user-add.svg';
import Form from './Form';
import { useAuth } from '../../lib/Auth';
import LoadingSpinnerInline from './LoadingSpinnerInline';
import CloseIcon from '../../assets/icons/close.svg';

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
  border: unset;
`;

export default function InviteUserToMatrixRoom({ roomId, name }) {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [isInviteDialogueOpen, setIsInviteDialogueOpen] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isInviting, setIsInviting] = useState(false);
    const [isFetchingSearchResults, setIsFetchingSearchResults] = useState(false);
    const customStyles = {
        content: {
            top: '50%',
            right: 'auto',
            bottom: 'auto',
            left: '50%',
            padding: 'calc(var(--margin) * 2)',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
        },
    };

    const { t } = useTranslation();

    const handleClick = () => {
        setIsInviteDialogueOpen(prevState => !prevState);
    };

    const onContributorInputValueChanged = (event) => {
        setSearchInput(event.target.value);
        debouncedFetchUsersForContributorSearch(event.target.value);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetchUsersForContributorSearch = useCallback(debounce((val) => fetchUsersForContributorSearch(val), 300), []);

    const fetchUsersForContributorSearch = useCallback(async (a) => {
        setIsFetchingSearchResults(true);
        try {
            const users = await matrixClient.searchUserDirectory({ term: a });
            // we only update the state if the returned array has entries, to be able to check if users a matrix users or not further down in the code (otherwise the array gets set to [] as soon as you selected an option from the datalist)
            users.results.length > 0 && setSearchResults(users.results);
        } catch (err) {
            console.error('Error whhile trying to fetch users: ' + err);
        } finally {
            setIsFetchingSearchResults(false);
        }
    }, [matrixClient]);

    const handleInvite = (e) => {
        alert('invited!');
    };

    return <>
        <button title={t('Invite another user')} onClick={handleClick}>
            <UserAddIcon fill="var(--color-foreground)" />
        </button>
        { isInviteDialogueOpen && (
            <Modal
                isOpen={isInviteDialogueOpen}
                onRequestClose={() => setIsInviteDialogueOpen(false)}
                contentLabel="Invite Users"
                style={customStyles}
                shouldCloseOnOverlayClick={true}>

                <Header>
                    { t('Invite user to') } { name } <CloseButton onClick={() => setIsInviteDialogueOpen(false)}>
                        <CloseIcon />
                    </CloseButton>
                </Header>
                <Form onSubmit={handleInvite}>
                    <input
                        type="text"
                        list="userSearch"
                        placeholder={t('user name')}
                        value={searchInput}
                        onChange={onContributorInputValueChanged}
                        autoComplete="off"
                    />
                    <datalist id="userSearch">
                        { searchResults.map((user, i) => {
                            return <option key={i} value={user.display_name + ' ' + user.user_id}>{ user.display_name } ({ user.user_id })</option>;
                        }) }
                    </datalist>
                    <button type="submit"
                        disabled={!searchInput || isInviting || isFetchingSearchResults}
                    >{ isInviting || isFetchingSearchResults ? <LoadingSpinnerInline /> || '✓' : t('Invite') }
                    </button>
                </Form>
            </Modal>
        ) }
    </>;
}
