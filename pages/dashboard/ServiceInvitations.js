import _ from 'lodash';
import getConfig from 'next/config';

import DisplayInvitations from './DisplayInvitations';

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
    const serviceInvitations = [...invitations.values()].filter(invite => serviceTemplates.includes(invite.meta?.template)); // filter invitations for the current service

    if (_.isEmpty(serviceInvitations)) return null;

    return _.map(serviceInvitations, (invite) => {
        return <DisplayInvitations
            key={invite.roomId}
            service={service}
            name={name}
            invite={invite}
            declineMatrixInvite={declineMatrixInvite}
            acceptMatrixInvite={acceptMatrixInvite} />;
    })

    ;
};

export default ServiceInvitations;
