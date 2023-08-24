import styled from 'styled-components';
import _ from 'lodash';
import getConfig from 'next/config';
// import { useAuth } from '../../lib/Auth';
// import { useMatrix } from '../../lib/Matrix';
import { useTranslation } from 'react-i18next';

import DisplayInvitations from './DisplayInvitations';
// import DisplayLatestLinks from './DisplayLatestLinks';
import { ServiceTable } from '../../components/UI/ServiceTable';

/**
 * COMPONENT 'ApplicationSection'
 *
 * @TODO
 *
 *
 * @param {String} name — name of the Application
 * @param {String} id — id of the application
*/

const TableSection = styled.section`
  overflow-x: auto;

  tbody tr:hover {
    background-color: var(--color-background-alpha);
  }
`;

const ServiceInvitations = ({ service, id, invitations, acceptMatrixInvite, declineMatrixInvite }) => {
    const name = getConfig().publicRuntimeConfig.authProviders[service].path || service;
    const serviceTemplates = getConfig().publicRuntimeConfig.authProviders[service].templates;
    const serviceInvitations = [...invitations.values()].filter(invite => serviceTemplates.includes(invite.meta.template)); // filter invitations for the current service

    const { t } = useTranslation('dashboard');

    if (_.isEmpty(serviceInvitations)) return null;

    return (
        <TableSection>
            { /* { applicationChildren && <ApplicationSegment>
                <DisplayLatestLinks
                    latestApplicationChildren={applicationChildren.slice(0, 5)}
                    applicationUrlName={name.replace(/[^a-zA-Z0-9 ]/g, '')} />
            </ApplicationSegment> } */ }
            <ServiceTable>
                <ServiceTable.Caption>
                    { t('Invitations') }
                </ServiceTable.Caption>
                <ServiceTable.Head>
                    <ServiceTable.Row>
                        <ServiceTable.Header align="left">
                            { t('App') }
                        </ServiceTable.Header>
                        <ServiceTable.Header align="left">
                            { t('Item') }
                        </ServiceTable.Header>
                        <ServiceTable.Header align="left">
                            { t('From') }
                        </ServiceTable.Header>
                        <ServiceTable.Header align="center">
                            { t('Accept') }
                        </ServiceTable.Header>
                        <ServiceTable.Header align="center">
                            { t('Decline') }
                        </ServiceTable.Header>
                    </ServiceTable.Row>
                </ServiceTable.Head>
                <ServiceTable.Body>
                    { _.map(serviceInvitations, (invite) => {
                        return <DisplayInvitations
                            key={invite.roomId}
                            service={service}
                            name={name}
                            invite={invite}
                            declineMatrixInvite={declineMatrixInvite}
                            acceptMatrixInvite={acceptMatrixInvite} />;
                    }) }
                </ServiceTable.Body>
            </ServiceTable>
        </TableSection>
    );
};

export default ServiceInvitations;
