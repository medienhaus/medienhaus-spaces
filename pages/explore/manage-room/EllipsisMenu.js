import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { RiClipboardLine, RiFolderCloseLine, RiMoreLine } from '@remixicon/react';

import { useAuth } from '@/lib/Auth';
import { isValidUrl } from '@/lib/utils';
import Icon from '@/components/UI/Icon';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/UI/shadcn/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/UI/shadcn/DropdownMenu';
import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';

const DialogContext = createContext();

export const EllipsisMenu = ({ children }) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <DialogContext.Provider value={{ dialogOpen, setDialogOpen }}>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DropdownMenu>
                    <DropdownMenuTrigger className="align-middle">
                        <Icon>
                            <RiMoreLine />
                        </Icon>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>{children}</DropdownMenuContent>
                </DropdownMenu>
            </Dialog>
        </DialogContext.Provider>
    );
};

export const CopyToClipboard = ({ href }) => {
    const { t } = useTranslation();

    if (!href) return null;

    return (
        <DropdownMenuItem
            className="grid w-full grid-flow-col justify-start gap-2"
            onClick={() => navigator.clipboard.writeText(isValidUrl(href) ? href : `${location.protocol}//${location.hostname}${href}`)}
        >
            <Icon>
                <RiClipboardLine />
            </Icon>
            <span>{t('Copy link to clipboard')}</span>
        </DropdownMenuItem>
    );
};

export const RemoveItem = ({ parentName, name, parentRoomId, onRemove, myPowerLevel }) => {
    const { t } = useTranslation();
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(parentRoomId);
    const canRemoveFromParent = room?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel);
    const { setDialogOpen } = useContext(DialogContext);

    if (!canRemoveFromParent) return null;

    return (
        <>
            <DialogTrigger asChild>
                <DropdownMenuItem
                    className="grid w-full grid-flow-col justify-start gap-2"
                    variant="ghost"
                    onClick={() => setDialogOpen(true)}
                >
                    <Icon>
                        <RiFolderCloseLine />
                    </Icon>
                    <span>{t('Remove')}</span>
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Are you absolutely sure you want to remove {{name}}', { name: name })}</DialogTitle>
                    <DialogDescription>
                        {t('This will only remove {{name}} from {{space}}. It will not delete {{name}}', {
                            name: name,
                            space: parentName,
                        })}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <ConfirmCancelButtons
                        confirmLabel="Remove"
                        destructive
                        onConfirm={async () => {
                            const remove = await onRemove();

                            if (remove) {
                                setDialogOpen(false);
                                toast.success(t('You have removed {{name}} from {{space}}', { name: name, space: parentName }));
                            }
                        }}
                    />
                </DialogFooter>
            </DialogContent>
        </>
    );
};
