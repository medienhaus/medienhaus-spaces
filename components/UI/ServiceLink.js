import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import styled from 'styled-components';

import LockIcon from '../../assets/icons/lock.svg';
import { ServiceTable } from './ServiceTable';

const LockIconResized = styled(LockIcon)`
  display: block;
  transform: scale(0.9);
`;

const ServiceLink = forwardRef(({ roomId, name, selected, path, passwordProtected }, ref) => {
    const { t } = useTranslation();

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell selected={selected}>
                <Link ref={ref} disabled href={`/${path}/${roomId}`}>{ name }</Link>
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
