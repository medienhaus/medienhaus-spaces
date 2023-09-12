
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Form from './Form';
import ConfirmCancelButtons from './ConfirmCancelButtons';
import { useAuth } from '../../lib/Auth';
import EditIcon from '../../assets/icons/edit.svg';
import DefaultModal from './Modal';

/**
 * EditRoomName component for changing the name of a matrix room or space.
 *
 * @component
 * @param {string} title - The current title of the room.
 * @param {string} roomId - The ID of the room to edit.
 * @returns {JSX.Element} - The rendered component.
 */

const EditRoomName = ({ title, roomId }) => {
    const [inputValue, setInputValue] = useState(title);
    const [isChangingName, setIsChangingName] = useState(false);
    const [isChangingNameDialogueOpen, setIsChangingNameDialogueOpen] = useState(false);
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsChangingName(true);
        await matrixClient.setRoomName(roomId, inputValue)
            .catch(error => {
                alert(error.data?.error);
                setIsChangingName(false);

                return;
            });
        setIsChangingName(false);
        setIsChangingNameDialogueOpen(false);
    };

    return (<>
        <button title={t('Invite users to' + ' ' + title)} onClick={() => setIsChangingNameDialogueOpen(prevState => !prevState)}>
            <EditIcon fill="var(--color-foreground)" />
        </button>
        { isChangingNameDialogueOpen && (
            <DefaultModal
                isOpen={isChangingNameDialogueOpen}
                onRequestClose={() => setIsChangingNameDialogueOpen(false)}
                contentLabel="Invite Users"
                shouldCloseOnOverlayClick={true}
                headline={t('Change name of {{name}}', { name: title })}
            >

                <Form onSubmit={handleSubmit}>
                    <input type="text" disabled={isChangingName} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                    <ConfirmCancelButtons disabled={title === inputValue} onCancel={() => setInputValue(title)} />
                </Form>
            </DefaultModal>
        )
        }
    </>
    );
};
export default EditRoomName;
