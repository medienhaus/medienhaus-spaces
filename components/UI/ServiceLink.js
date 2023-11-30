import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import styled from 'styled-components';
import { LockIcon } from '@remixicons/react/line';

import { ServiceTable } from './ServiceTable';
import Icon from './Icon';

const LockIconWrapper = styled(Icon)`
  position: relative;
  display: inline-block;
  top: 0.195rem;
  margin-left: calc(var(--margin) / 2);
  transform: scale(70%);

  svg {
    fill: var(--color-disabled);
  }
`;

const BlockLink = styled(Link)`
  display: block;
`;

const NotificationBadge = styled.span`
  justify-self: end;
  padding: 0 calc(var(--margin) / 4);
  line-height: var(--line-height);
  color: rgb(255 255 255);
  background-color: var(--color-notification);

  > small {
    font-weight: 600;
  }
`;

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

const ServiceLink = forwardRef(({ name, href, selected, passwordProtected, notifications, avatar }, ref) => {
    const { t } = useTranslation();

    return (
        <ServiceTable.Row>
            { avatar && (
                <ServiceTable.Cell>
                    <Avatar src={avatar} alt={name} />
                </ServiceTable.Cell>)
            }
            <ServiceTable.Cell width="100%">
                <BlockLink
                    ref={ref}
                    href={href}
                >
                    { name }
                    { /* Show a lock icon if this Link is password protected */ }
                    { passwordProtected && <LockIconWrapper title={t('password protected')}><LockIcon /></LockIconWrapper> }
                </BlockLink>
            </ServiceTable.Cell>
            { /* Tell if this is our active item by displaying an arrow */ }
            { selected &&
                <ServiceTable.Cell align="right">
                    →
                </ServiceTable.Cell>
            }
            { /* Show notification badge if there are notifications */ }
            { !selected && notifications > 0 &&
                <ServiceTable.Cell>
                    <NotificationBadge>
                        <small>
                            { notifications < 100 ? notifications : '99+' }
                        </small>
                    </NotificationBadge>
                </ServiceTable.Cell>
            }
        </ServiceTable.Row>
    );
});
ServiceLink.displayName = 'ServiceLink';

export default ServiceLink;
