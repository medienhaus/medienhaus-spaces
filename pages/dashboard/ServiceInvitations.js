import _ from 'lodash';
import getConfig from 'next/config';

import DisplayInvitations from './DisplayInvitations';
import { useAuth } from '../../lib/Auth';
import { useMatrix } from '../../lib/Matrix';

/**
 * Callback definitions
 */
/**
 * @callback acceptMatrixInvite
 * @param {string} roomId
 * @param {string} path
 */
/**
 * @callback declineMatrixInvite
 * @param {string} roomId
 */

/**
 * Displays single invitations of a given service
 *
 * @param {React.ComponentPropsWithoutRef} props
 * @param {string} props.service
 * @param {Object[]} props.invitations
 * @param {acceptMatrixInvite} props.acceptMatrixInvite
 * @param {declineMatrixInvite} props.declineMatrixInvite
 *
 * @returns {React.ReactNode}
 */
export default function ServiceInvitations({ service, invitations, acceptMatrixInvite, declineMatrixInvite }) {
    const matrix = useMatrix();
    const MatrixAuthProvider = useAuth().getAuthenticationProvider('matrix');

    // we check if there is a custom path name defined and if so remove any forbidden url characters from the string
    const path = getConfig().publicRuntimeConfig.authProviders[service].path || service;
    const serviceInvitations = invitations.filter(invite => invite.meta?.template === service); // filter invitations for the current service

    if (_.isEmpty(serviceInvitations)) return null;

    const handleAccept = async (roomId, path) => {
        const forwardingUrl = await acceptMatrixInvite(roomId, path).catch(() => {});
        if (!forwardingUrl) return;

        // if an invitation for a chat room was accepted we don't need to add it to a space
        await MatrixAuthProvider.addSpaceChild(matrix.serviceSpaces[service], roomId).catch(() => {});

        return forwardingUrl;
    };

    return _.map(serviceInvitations, (invite) => (
        <DisplayInvitations
            key={invite.roomId}
            path={path}
            invite={invite}
            declineMatrixInvite={declineMatrixInvite}
            acceptMatrixInvite={handleAccept}
        />
    ));
}
