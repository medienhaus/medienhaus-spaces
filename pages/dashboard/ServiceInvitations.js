import _ from 'lodash';
import getConfig from 'next/config';

import DisplayInvitations from './DisplayInvitations';

/**
 * Displays single invitations of a given service
 * @date 30/08/2023 - 17:07:55
 *
 * @param {String} service
 * @param {Array} invitations
 * @callback acceptMatrixInvite
 *  * @param e - event triggered by the button
 *  * @param roomId - matrix roomId
 *  * @param service - name of the service (parsed to the function)
 * @callback declineMatrixInvite
 *  * @param e - event triggered by the button
 *  * @param roomId - matrix roomId
 * @returns {React.ReactComponent}
 */
const ServiceInvitations = ({ service, invitations, acceptMatrixInvite, declineMatrixInvite }) => {
    const name = getConfig().publicRuntimeConfig.authProviders[service].path || service;
    const serviceInvitations = invitations.filter(invite => invite.meta?.template === service); // filter invitations for the current service

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
