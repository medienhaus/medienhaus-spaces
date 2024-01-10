import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { styled } from 'styled-components';
import { LockIcon } from '@remixicons/react/line';

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

const ServiceLink = forwardRef(({ name, href, selected, passwordProtected }, ref) => {
    const { t } = useTranslation();

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell>
                { /* Tell if this is our active item by displaying an arrow */ }
                { selected && <span style={{ float: 'right' }}>→</span> }
                <Link
                    style={{ display: 'block' }}
                    ref={ref}
                    href={href}
                >
                    { name }
                    { /* Show a lock icon if this Link is password protected */ }
                    { passwordProtected && <LockIconWrapper title={t('password protected')}><LockIcon /></LockIconWrapper> }
                </Link>
            </ServiceTable.Cell>
        </ServiceTable.Row>
    );
});
ServiceLink.displayName = 'ServiceLink';

export default ServiceLink;
