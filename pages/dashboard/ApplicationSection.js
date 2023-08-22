import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import getConfig from 'next/config';

// import { useAuth } from '../../lib/Auth';
// import { useMatrix } from '../../lib/Matrix';
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

const ApplicationSection = ({ service, id, invitations, acceptMatrixInvite, rejectMatrixInvite }) => {
    // const auth = useAuth();
    // const matrixClient = auth.getAuthenticationProvider('matrix').getMatrixClient();
    // const matrix = useMatrix(auth.getAuthenticationProvider('matrix'));
    // const applicationSpace = matrix.spaces.get(id);
    const { t } = useTranslation('dashboard');
    const name = getConfig().publicRuntimeConfig.authProviders[service].path || service;
    const serviceTemplates = getConfig().publicRuntimeConfig.authProviders[service].templates;

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
            { invitations.size > 0 && <ApplicationSegment>
                <h2>{ t('Invitations') }</h2>
                <ServiceTable>
                    { _.map([...invitations.values()], (invite) => {
                        if (!serviceTemplates.includes(invite.meta.template)) return null; // only display invitations from the current service

                        return <DisplayInvitations
                            key={invite.roomId}
                            service={service}
                            name={name}
                            invite={invite}
                            rejectMatrixInvite={rejectMatrixInvite}
                            acceptMatrixInvite={acceptMatrixInvite} />;
                    }) }
                </ServiceTable>
            </ApplicationSegment> }

        </section>
    );
};

export default ApplicationSection;
