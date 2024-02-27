import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import _, { debounce } from 'lodash';
import { logger } from 'matrix-js-sdk/lib/logger';

import ErrorMessage from '../ErrorMessage';
import Datalist from '../DataList';
import { useAuth } from '@/lib/Auth';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader } from '@/components/UI/shadcn/Dialog';
import { Button } from '@/components/UI/shadcn/Button';

/**
 * A modal-like interface to invite other users to a given Matrix room.
 *
 * @param {string} roomId - The ID of the Matrix room to invite users to.
 * @param {React.ReactElement} trigger - Something like a button that will open the modal when clicked.
 *
 * @returns {React.ReactElement} - A React component representing the invitation UI.
 */
export const InviteUserToMatrixRoom = ({ roomId, trigger }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation('invitationModal');

    const [isOpen, setIsOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
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
            }, 3000),
        );
    };

    return (
        <>
            {React.cloneElement(trigger, {
                onClick: () => {
                    setIsOpen(true);
                },
            })}
            <Dialog
                open={isOpen}
                onOpenChange={(newState) => {
                    setIsOpen(newState);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <h3>{t('Invite users')}</h3>
                    </DialogHeader>
                    <div>
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
                                <div>
                                    {userFeedback && errorFeedback && userFeedback}
                                    {!_.isEmpty(errorFeedback) &&
                                        errorFeedback.map((error) => <ErrorMessage key={error}>{error}</ErrorMessage>)}
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild props>
                            <Button variant="outline">{t('Cancel')}</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
