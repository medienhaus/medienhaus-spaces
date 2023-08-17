import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import styled from 'styled-components';

import LockIcon from '../../assets/icons/lock.svg';
import { ServiceTable } from '../../components/UI/ServiceTable';

const LockIconResized = styled(LockIcon)`
  display: block;
  transform: scale(0.9);
`;

const EtherpadListEntry = forwardRef(({ roomId, padName, passwordProtected, selected }, ref) => {
    const { t } = useTranslation('write');

    return (
        <ServiceTable.Row>
            <ServiceTable.Cell selected={selected}><Link ref={ref} disabled href={`/write/${roomId}`}>{ padName }</Link></ServiceTable.Cell>
            { /* Show a lock icon if this is a password protected pad */ }
            { passwordProtected && (
                <ServiceTable.Cell title={t('password protected')}>
                    <LockIconResized />
                </ServiceTable.Cell>
            ) }
        </ServiceTable.Row>
    );
});
export default EtherpadListEntry;
