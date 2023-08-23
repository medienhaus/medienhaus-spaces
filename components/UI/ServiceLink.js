import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import styled from 'styled-components';

import LockIcon from '../../assets/icons/lock.svg';
import { ServiceTable } from './ServiceTable';

const LockIconResized = styled(LockIcon)`
  display: block;
  transform: scale(0.9);
`;

const ServiceLink = ({ roomId, name, selected, path, passwordProtected }) => {
    const { t } = useTranslation();

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell selected={selected}>
                <Link disabled href={`/${path}/${roomId}`}>{ name }</Link>
            </ServiceTable.Cell>
            { /* Show a lock icon if this is a password protected pad */ }
            { passwordProtected && (
                <ServiceTable.Cell title={t('password protected')}>
                    <LockIconResized />
                </ServiceTable.Cell>
            ) }
        </ServiceTable.Row>
    );
};
export default ServiceLink;
