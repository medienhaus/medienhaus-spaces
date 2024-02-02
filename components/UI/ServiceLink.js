import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from 'styled-components';
import { RiArrowRightLine, RiLockLine } from '@remixicon/react';
import Link from 'next/link';

import { ServiceTable } from './ServiceTable';
import Icon from './Icon';
import LoadingSpinnerInline from './LoadingSpinnerInline';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/UI/shadcn/Avatar';

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

const ServiceLink = forwardRef(({ roomId, href, name, selected, path, passwordProtected, thumbnail, notificationCount, small, isFetchingContent }, ref) => {
    const { t } = useTranslation();

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell>
                <Link ref={ref} href={href} className="flex items-center justify-between">
                    {thumbnail && (
                        <Avatar className="mr-3">
                            <AvatarImage src={thumbnail} />
                            <AvatarFallback />
                        </Avatar>
                    )}
                    <span className="flex-grow">{ name }</span>
                    { roomId && isFetchingContent === roomId && <LoadingSpinnerInline /> }
                    { /* Show a lock icon if this Link is password protected */ }
                    { passwordProtected && (
                        <LockIconWrapper title={t('password protected')}>
                            <RiLockLine />
                        </LockIconWrapper>
                    ) }
                    {/* Show notification badge if there are notifications */}
                    {notificationCount > 0 && <NotificationBadge>{notificationCount < 100 ? notificationCount : '99+'}</NotificationBadge>}
                    {/* Tell if this is our active item by displaying an arrow */}
                    {selected && <RiArrowRightLine className="h-4 w-4 ml-2" />}
                </Link>
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
});
ServiceLink.displayName = 'ServiceLink';

export default ServiceLink;
