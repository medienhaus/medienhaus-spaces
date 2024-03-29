import React, { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from 'styled-components';
import { toast } from 'sonner';
import { RiArrowRightLine, RiClipboardLine, RiFolderCloseLine, RiLockLine, RiMoreLine } from '@remixicon/react';
import Link from 'next/link';

import { ServiceTable } from './ServiceTable';
import Icon from './Icon';
import LoadingSpinnerInline from './LoadingSpinnerInline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/UI/shadcn/Avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/UI/shadcn/DropdownMenu';
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
import { useAuth } from '@/lib/Auth';
import { isValidUrl } from '@/lib/utils';

const LockIconWrapper = styled(Icon)`
    display: inline-block;
    margin-left: calc(var(--margin) / 2);
    transform: scale(70%);

    svg {
        fill: var(--color-disabled);
    }
`;

const NotificationBadge = styled.span`
    width: 4ch;
    font-size: 70%;
    line-height: 170%;
    color: rgb(255 255 255);
    text-align: center;
    background-color: var(--color-notification);
    border-radius: var(--border-radius);

    > small {
        font-weight: 600;
    }
`;
// @TODO figure out what to do with optional menu and logic for menu, could use better solution
// @TODO success message closes too quickly

function EllipsisMenu({ parentName, name, parentRoomId, onRemove, myPowerLevel, href }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { t } = useTranslation();
    const matrixClient = useAuth().getAuthenticationProvider('matrix').getMatrixClient();
    const room = matrixClient.getRoom(parentRoomId);
    const canRemoveFromParent = room?.currentState.hasSufficientPowerLevelFor('m.space.child', myPowerLevel);

    return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger className="align-middle">
                    <RiMoreLine />
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
}

const ServiceLink = forwardRef(
    (
        {
            roomId,
            href,
            name,
            parentName,
            selected,
            path,
            target,
            passwordProtected,
            thumbnail,
            notificationCount,
            small,
            isFetchingContent,
            onRemove,
            myPowerLevel,
            parentRoomId,
        },
        ref,
    ) => {
        const { t } = useTranslation();

        return (
            <ServiceTable.Row>
                <ServiceTable.Cell>
                    <Link ref={ref} target={target} href={href} rel="noopener noreferrer" className="flex items-center justify-between">
                        {thumbnail && (
                            <Avatar className="mr-3 h-8 w-8">
                                <AvatarImage src={thumbnail} />
                                <AvatarFallback />
                            </Avatar>
                        )}
                        <span className="w-0 flex-grow overflow-hidden text-ellipsis">{name}</span>
                        {roomId && isFetchingContent === roomId && <LoadingSpinnerInline />}
                        {/* Show a lock icon if this Link is password protected */}
                        {passwordProtected && (
                            <LockIconWrapper title={t('password protected')}>
                                <RiLockLine />
                            </LockIconWrapper>
                        )}
                        {/* Show notification badge if there are notifications */}
                        {notificationCount > 0 && (
                            <NotificationBadge>{notificationCount < 100 ? notificationCount : '99+'}</NotificationBadge>
                        )}
                        {/* Tell if this is our active item by displaying an arrow */}
                        {selected && <RiArrowRightLine className="ml-2 h-4 w-4" />}
                    </Link>
                </ServiceTable.Cell>
                {onRemove && (
                    <ServiceTable.Cell align="right">
                        <EllipsisMenu
                            parentName={parentName}
                            onRemove={onRemove}
                            myPowerLevel={myPowerLevel}
                            parentRoomId={parentRoomId}
                            name={name}
                            href={href}
                        />
                    </ServiceTable.Cell>
                )}
            </ServiceTable.Row>
        );
    },
);
ServiceLink.displayName = 'ServiceLink';

export default ServiceLink;
