import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import _, { debounce } from 'lodash';
import { logger } from 'matrix-js-sdk/lib/logger';
import { toast } from 'sonner';

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
                logger.error('Error while trying to fetch users', err);
            }
        },
        [matrixClient],
    );

    function clearInputs() {
        setSearchResults([]);
    }

    const handleInvite = async (selectedUsers) => {
        const errors = [];

        for (const user of selectedUsers) {
            await matrixClient.invite(roomId, user.user_id).catch(async (error) => {
                // avoid adding duplicates
                if (errors.includes(error.data.error)) return;
                // display errors in a toast
                errors.push(error.data.error);
                toast.error(error.data.error);
            });
        }

        // if everything is okay, we let the user know and exit the view.
        for (const selectedUser of selectedUsers) {
            toast.success(
                t('{{selectedUser}} was invited and needs to accept your invitation', { selectedUser: selectedUser.display_name }),
            );
        }

        await new Promise(() =>
            setTimeout(() => {
                clearInputs();
            }, 3000),
        );

        // close the modal if there are no errors
        if (errors.length === 0) setIsOpen(false);
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
                        <Datalist
                            options={searchResults}
                            onInputChange={handleChange}
                            keysToDisplay={['display_name', 'user_id']}
                            onSubmit={handleInvite}
                        />
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
