import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'next/router';
import { RiErrorWarningLine } from '@remixicon/react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/Auth';
import ErrorMessage from '../../../components/UI/ErrorMessage';
import { Button } from '@/components/UI/shadcn/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/UI/shadcn/Dialog';
import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';
import { Alert, AlertDescription } from '@/components/UI/shadcn/Alert';

/**
 * LeaveRoom component for leaving a Matrix room.
 *
 * @param {string} roomId - The ID of the room to leave.
 * @param {string} parentId - The ID of the parent room or space (if applicable).
 * @param {string} roomName - The name of the room to be left.
 * @param {Function} onCancel - Callback function to cancel the operation.
 * @returns {JSX.Element} - The rendered component.
 *
 * @TODO warning message should use conditional, depending on join rule and or visibility of item
 */
const LeaveRoom = ({ roomId, parentId, roomName, onCancel }) => {
    const auth = useAuth();
    const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    const [isLeaving, setIsLeaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    const { t } = useTranslation('explore');

    const handleLeaveRoom = async (e) => {
        e.preventDefault();
        setIsLeaving(true);

        // Leave the main room
        await matrixClient.leave(roomId).catch((error) => {
            setErrorMessage(error.data?.error || t('Something went wrong. Please try again'));
            setIsLeaving(false);

            return;
        });

        setIsLeaving(false);
        toast.success(t('You have left {{name}}.', { name: roomName }));
        setErrorMessage('');
        parentId && router.push(parentId);
    };

    return (
        <>
            <h3>{t('Leave {{ name }}?', { name: roomName })}</h3>
            <Alert variant="destructive">
                <RiErrorWarningLine />
                <AlertDescription>{t('Leaving {{name}} means you cannot interact with it anymore.', { name: roomName })}</AlertDescription>
            </Alert>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full" variant="destructive" disabled={isLeaving}>
                        {t('Leave')}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Are you absolutely sure you want to leave {{name}}?', { name: roomName })}</DialogTitle>
                        <DialogDescription>
                            {t(
                                'If this room is not public, you need to either ask to join or be invited, in order to join the room again.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <form onSubmit={handleLeaveRoom} onReset={() => setDialogOpen(false)}>
                            <ConfirmCancelButtons confirmLabel={t('Leave')} onCancel={onCancel} disabled={isLeaving} destructive />
                        </form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </>
    );
};

export default LeaveRoom;
