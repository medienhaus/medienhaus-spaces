import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { styled } from 'styled-components';

import { ServiceTable } from './ServiceTable';
import { LockIcon } from '@remixicons/react/line';

const LockIconResized = styled(LockIcon)`
  display: block;
  transform: scale(0.9);
`;

const ServiceLink = forwardRef(({ name, href, selected, passwordProtected }, ref) => {
    const { t } = useTranslation();

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell selected={selected}>
                <Link ref={ref} href={href}>{ name }</Link>
            </ServiceTable.Cell>
            { /* Show a lock icon if this Link is password protected */ }
            { passwordProtected && (
                <ServiceTable.Cell title={t('password protected')}>
                    <LockIconResized />
                </ServiceTable.Cell>
            ) }
        </ServiceTable.Row>
    );
});

export default ServiceLink;
