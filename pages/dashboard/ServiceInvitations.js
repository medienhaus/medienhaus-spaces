import _ from 'lodash';
import getConfig from 'next/config';

import DisplayInvitations from './DisplayInvitations';

/**
 * Displays single invitations of a given service
 *
 * @param {String} service
 * @param {Array} invitations
 * @callback acceptMatrixInvite
 *  * @param roomId - matrix roomId
 *  * @param service - name of the service (parsed to the function)
 * @callback declineMatrixInvite
 *  * @param roomId - matrix roomId
 * @returns {React.ReactComponent}
 */
const ServiceInvitations = ({ service, invitations, acceptMatrixInvite, declineMatrixInvite }) => {
    // we check if there is a custom path name defined and if so remove any forbidden url characters from the string
    const path = getConfig().publicRuntimeConfig.authProviders[service].path?.replace(/[<>\s/:]/g, '') || service;
    const serviceInvitations = invitations.filter(invite => invite.meta?.template === service); // filter invitations for the current service

    if (_.isEmpty(serviceInvitations)) return null;

    return _.map(serviceInvitations, (invite) => {
        return <DisplayInvitations
            key={invite.roomId}
            service={service}
            path={path}
            invite={invite}
            declineMatrixInvite={declineMatrixInvite}
            acceptMatrixInvite={acceptMatrixInvite} />;
    })

    ;
};

export default ServiceInvitations;
