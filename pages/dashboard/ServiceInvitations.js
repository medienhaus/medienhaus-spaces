import _ from 'lodash';
import getConfig from 'next/config';
// import { useAuth } from '../../lib/Auth';
// import { useMatrix } from '../../lib/Matrix';
import { useTranslation } from 'react-i18next';

import styles from './style.module.css';
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

const ServiceInvitations = ({ service, id, invitations, acceptMatrixInvite, declineMatrixInvite }) => {
    const name = getConfig().publicRuntimeConfig.authProviders[service].path || service;
    const serviceTemplates = getConfig().publicRuntimeConfig.authProviders[service].templates;
    const serviceInvitations = [...invitations.values()].filter(invite => serviceTemplates.includes(invite.meta.template)); // filter invitations for the current service

    const { t } = useTranslation('dashboard');

    if (_.isEmpty(serviceInvitations)) return null;

    return (
        <section>
            { /* { applicationChildren && <ApplicationSegment>
                <DisplayLatestLinks
                    latestApplicationChildren={applicationChildren.slice(0, 5)}
                    applicationUrlName={name.replace(/[^a-zA-Z0-9 ]/g, '')} />
            </ApplicationSegment> } */ }
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
        </section>
    );
};

export default ServiceInvitations;
