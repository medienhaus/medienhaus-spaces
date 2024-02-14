import React, { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from 'styled-components';
import { RiArrowRightLine, RiLockLine, RiMoreLine } from '@remixicon/react';
import Link from 'next/link';
import _ from 'lodash';

import { ServiceTable } from './ServiceTable';
import Icon from './Icon';
import LoadingSpinnerInline from './LoadingSpinnerInline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/UI/shadcn/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/UI/shadcn/Dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/UI/shadcn/Dialog';
import { Button } from '@/components/UI/shadcn/Button';
import ConfirmCancelButtons from '@/components/UI/ConfirmCancelButtons';

const LockIconWrapper = styled(Icon)`
    position: relative;
    top: 0.195rem;
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

const ServiceLink = forwardRef(
    ({ roomId, href, name, selected, path, passwordProtected, thumbnail, notificationCount, small, isFetchingContent, onRemove }, ref) => {
        const [dialogOpen, setDialogOpen] = useState(false);
        const [wasRemoved, setWasRemoved] = useState(false);
        const { t } = useTranslation();

        return (
            <ServiceTable.Row>
                <ServiceTable.Cell>
                    <Link ref={ref} href={href} className="flex items-center justify-between">
                        {thumbnail && (
                            <Avatar className="mr-3 h-8 w-8">
                                <AvatarImage src={thumbnail} />
                                <AvatarFallback />
                            </Avatar>
                        )}
                        <span className="flex-grow">{name}</span>
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
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <RiMoreLine />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost">{t('Remove')}</Button>
                                        </DialogTrigger>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogContent>
                                {wasRemoved ? (
                                    'was removed'
                                ) : (
                                    <DialogHeader>
                                        <DialogTitle>
                                            {t('Are you absolutely sure you want to remove ')} {name}
                                        </DialogTitle>

                                        <DialogDescription>
                                            {t('This will only remove <<name>> from <<space>>. It will not delete <<name>>')}
                                        </DialogDescription>
                                        <DialogFooter>
                                            <form
                                                onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    await onRemove();
                                                    setWasRemoved(true);
                                                    _.delay(() => {
                                                        setDialogOpen(false);
                                                        setWasRemoved(false);
                                                    }, 1000);
                                                }}
                                                onReset={() => setDialogOpen(false)}
                                            >
                                                <ConfirmCancelButtons confirmLabel="Remove" />
                                            </form>
                                        </DialogFooter>
                                    </DialogHeader>
                                )}
                            </DialogContent>
                        </Dialog>
                    </ServiceTable.Cell>
                )}
            </ServiceTable.Row>
        );
    },
);
ServiceLink.displayName = 'ServiceLink';

export default ServiceLink;
