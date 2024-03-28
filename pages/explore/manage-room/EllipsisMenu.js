import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { RiClipboardLine, RiFolderCloseLine, RiMoreLine } from '@remixicon/react';

import { useAuth } from '@/lib/Auth';
import { isValidUrl } from '@/lib/utils';
import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/UI/shadcn/DropdownMenu';

const EllipsisMenu = ({ parentName, name, parentRoomId, onRemove, myPowerLevel, href }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { t } = useTranslation();
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(parentRoomId);
    const canRemoveFromParent = room?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel);

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger className="align-middle">
                    <Icon>
                        <RiMoreLine />
                    </Icon>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem
                        className="grid w-full grid-flow-col justify-start gap-2"
                        onClick={() =>
                            navigator.clipboard.writeText(isValidUrl(href) ? href : `${location.protocol}//${location.hostname}${href}`)
                        }
                    >
                        <Icon>
                            <RiClipboardLine />
                        </Icon>
                        <span>{t('Copy link to clipboard')}</span>
                    </DropdownMenuItem>
                    {canRemoveFromParent && (
                        <>
                            <DropdownMenuSeparator />
                            <DialogTrigger asChild>
                                <DropdownMenuItem className="grid w-full grid-flow-col justify-start gap-2" variant="ghost">
                                    <Icon>
                                        <RiFolderCloseLine />
                                    </Icon>
                                    <span>{t('Remove')}</span>
                                </DropdownMenuItem>
                            </DialogTrigger>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <DialogContent>
                <>
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
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const remove = await onRemove();

                                if (remove) {
                                    setDialogOpen(false);
                                    toast.success(t('You have removed {{name}} from {{space}}', { name: name, space: parentName }));
                                }
                            }}
                            onReset={() => setDialogOpen(false)}
                        >
                            <ConfirmCancelButtons confirmLabel="Remove" destructive />
                        </form>
                    </DialogFooter>
                </>
            </DialogContent>
        </Dialog>
    );
};

export default EllipsisMenu;
