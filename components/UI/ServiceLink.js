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

const StyledServiceTableRow = styled(ServiceTable.Row)`
  display: grid;

  /* NOTE: if we _do_not_ display avatar, then ... */

  grid-template-columns: max-content 1fr max-content;

  /* NOTE: if we display avatar, then ... */

  /*
  grid-template-columns: max-content 1fr max-content;
  */

  align-items: center;

  > :last-child:not(:only-child) {
    justify-self: end;
  }
`;

const ServiceTableLink = styled(Link)`
  display: block;
`;

const SelectedMarker = styled.span`
  /*
  float: right;
  */
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
        <StyledServiceTableRow>
            { avatar && (
                <ServiceTable.Cell>
                    <Avatar src={avatar} alt={name} />
                </ServiceTable.Cell>)
            }
            <ServiceTable.Cell>
                <ServiceTableLink
                    ref={ref}
                    href={href}
                >
                    { name }
                    { /* Show a lock icon if this Link is password protected */ }
                    { passwordProtected && <LockIconWrapper title={t('password protected')}><LockIcon /></LockIconWrapper> }
                </ServiceTableLink>
            </ServiceTable.Cell>
            { /* Tell if this is our active item by displaying an arrow */ }
            { selected &&
                <ServiceTable.Cell>
                    <SelectedMarker>→</SelectedMarker>
                </ServiceTable.Cell>
            }
            { /* Show notification badge if there are notifications */ }
            { !selected && notifications &&
                <ServiceTable.Cell>
                    <NotificationBadge>
                        <small>
                            { notifications < 100 ? notifications : '99+' }
                        </small>
                    </NotificationBadge>
                </ServiceTable.Cell>
            }
        </StyledServiceTableRow>
    );
});
ServiceLink.displayName = 'ServiceLink';

export default ServiceLink;
