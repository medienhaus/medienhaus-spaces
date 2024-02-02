import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { default as NextLink } from 'next/link';
import { styled } from 'styled-components';
import { RiLockLine } from '@remixicon/react';

import { ServiceTable } from './ServiceTable';
import Icon from './Icon';

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

const Link = styled(NextLink)`
    display: block;
`;

const Thumbnail = styled.img`
    position: relative;
    float: left;
    width: 2rem;
    height: 2rem;
    background-color: var(--color-foreground);
    border-radius: var(--border-radius);
`;

const NotificationBadge = styled.span`
    width: 4ch;
    font-size: 70%;
    line-height: 170%;
    color: rgb(255 255 255);
    text-align: center;
    background-color: var(--color-notification);
    border-radius: var(--border-radius);
    transform: translateY(-1px);

    > small {
        font-weight: 600;
    }
`;

const ServiceLink = forwardRef(({ name, href, selected, passwordProtected, thumbnail, notificationCount }, ref) => {
    const { t } = useTranslation();

    return (
        <ServiceTable.Row>
            {thumbnail && (
                <ServiceTable.Cell>
                    <Thumbnail src={thumbnail} alt={name} />
                </ServiceTable.Cell>
            )}
            <ServiceTable.Cell width="100%">
                <Link ref={ref} href={href}>
                    {name}
                    {/* Show a lock icon if this Link is password protected */}
                    {passwordProtected && (
                        <LockIconWrapper title={t('password protected')}>
                            <RiLockLine />
                        </LockIconWrapper>
                    )}
                </Link>
            </ServiceTable.Cell>
            {/* Show notification badge if there are notifications */}
            {notificationCount > 0 && (
                <ServiceTable.Cell>
                    <NotificationBadge>{notificationCount < 100 ? notificationCount : '99+'}</NotificationBadge>
                </ServiceTable.Cell>
            )}
            {/* Tell if this is our active item by displaying an arrow */}
            {selected && <ServiceTable.Cell align="right">→</ServiceTable.Cell>}
        </ServiceTable.Row>
    );
});
ServiceLink.displayName = 'ServiceLink';

export default ServiceLink;
