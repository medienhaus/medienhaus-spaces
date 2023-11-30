import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import styled from 'styled-components';
import { LockIcon } from '@remixicons/react/line';

import { ServiceTable } from './ServiceTable';
import Icon from './Icon';

const LockIconWrapper = styled(Icon)`
  position: relative;
  top: 0.195rem;
  margin-left: calc(var(--margin) / 2);
  transform: scale(70%);

  svg {
    fill: var(--color-disabled);
  }
`;

const NotificationBadge = styled.span`
  display: inline-grid;
  place-content: center;
  height: calc(1rem * var(--line-height));
  padding: 0 calc(var(--margin) / 4);
  color: rgb(255 255 255);
  background-color: var(--color-notification);

  > small {
    font-weight: 600;
  }
`;

/*
const Avatar = styled.img`
  position: relative;
  float: left;
  width: 2rem;
  height: 2rem;
  background-color: var(--color-foreground);

  &.placeholder {
    backdrop-filter: invert(100%);
  }
`;
*/

const ServiceLink = forwardRef(({ name, href, selected, passwordProtected, notifications, avatar }, ref) => {
    const { t } = useTranslation();

    return (
        <ServiceTable.Row>
            { /*{ avatar && (*/ }
            { /*    <ServiceTable.Cell>*/ }
            { /*        <Avatar src={avatar} alt={name} />*/ }
            { /*    </ServiceTable.Cell>) }*/ }
            <ServiceTable.Cell>
                { /* Tell if this is our active item by displaying an arrow */ }
                { selected && <span style={{ float: 'right' }}>→</span> }
                <Link
                    style={{ display: 'block' }}
                    ref={ref}
                    href={href}
                >
                    { name }
                    { /* Show notification badge if there are notifications */ }
                    { notifications && <NotificationBadge>
                        <small>
                            { notifications < 100 ? notifications : '99+' }
                        </small>
                    </NotificationBadge> }
                    { /* Show a lock icon if this Link is password protected */ }
                    { passwordProtected && <LockIconWrapper title={t('password protected')}><LockIcon /></LockIconWrapper> }
                </Link>
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
});
ServiceLink.displayName = 'ServiceLink';

export default ServiceLink;
