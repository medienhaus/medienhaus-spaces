import styled from 'styled-components';
import _ from 'lodash';
import getConfig from 'next/config';

// import { useAuth } from '../../lib/Auth';
// import { useMatrix } from '../../lib/Matrix';
import { useTranslation } from 'react-i18next';

import DisplayInvitations from './DisplayInvitations';
// import DisplayLatestLinks from './DisplayLatestLinks';
import { ServiceTable } from '../../components/UI/ServiceTable';

const ApplicationSegment = styled.div`
  margin-top: var(--margin);

  h2 {
    text-decoration: underline;
  }
`;

/**
 * COMPONENT 'ApplicationSection'
 *
 * @TODO
 *
 *
 * @param {String} name — name of the Application
 * @param {String} id — id of the application
*/

const ApplicationSection = ({ service, id, invitations, acceptMatrixInvite, declineMatrixInvite }) => {
    // const auth = useAuth();
    // const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    // const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    // const applicationSpace = matrix.spaces.get(id);
    const name = getConfig().publicRuntimeConfig.authProviders[service].path || service;
    const serviceTemplates = getConfig().publicRuntimeConfig.authProviders[service].templates;

    const { t } = useTranslation('dashboard');

    // const applicationChildren = applicationSpace?.children.map((childId) => {
    //     return matrix.spaces.get(childId) || matrix.rooms.get(childId);
    // });

    return (
        <section>
            { /* { applicationChildren && <ApplicationSegment>
                <DisplayLatestLinks
                    latestApplicationChildren={applicationChildren.slice(0, 5)}
                    applicationUrlName={name.replace(/[^a-zA-Z0-9 ]/g, '')} />
            </ApplicationSegment> } */ }
            <ApplicationSegment>
                <ServiceTable>
                    <ServiceTable.Head>
                        <ServiceTable.Row>
                            <ServiceTable.Header align="left">
                                <span>{ t('Invitations') }</span>
                            </ServiceTable.Header>
                            <ServiceTable.Header align="left">
                                <span>{ t('From') }</span>
                            </ServiceTable.Header>
                            <ServiceTable.Header align="center">
                                <span>{ t('Accept') }</span>
                            </ServiceTable.Header>
                            <ServiceTable.Header align="center">
                                <span>{ t('Decline') }</span>
                            </ServiceTable.Header>
                        </ServiceTable.Row>
                    </ServiceTable.Head>
                    <ServiceTable.Body>
                        { _.map([...invitations.values()], (invite) => {
                            if (!serviceTemplates.includes(invite.meta.template)) return null; // only display invitations from the current service

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
            </ApplicationSegment>

        </section>
    );
};

export default ApplicationSection;
