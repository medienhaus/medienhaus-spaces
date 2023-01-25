import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import getConfig from 'next/config';
import { mapValues, pickBy } from 'lodash';

import MatrixAuthProvider from './auth/MatrixAuthProvider';
import PeerTubeAuthProvider from './auth/PeerTubeAuthProvider';
import WriteAuthProvider from './auth/WriteAuthProvider';
import SketchAuthProvider from './auth/SketchAuthProvider';
/*
    Mapping of authentication provider types and which corresponding class should be used to actually perform
    any logic specifically related to the given authentication provider.

    You can define multiple authentication providers in the `next.config.js` file.
 */
const AuthProviders = {
    matrix: MatrixAuthProvider,
    matrixContentStorage: MatrixAuthProvider,
    peerTube: PeerTubeAuthProvider,
    write: WriteAuthProvider,
    sketch: SketchAuthProvider,
};

function useAuthProvider() {
    const [user, setUser] = useState(null);
    const [activeAuthentications] = useState(mapValues(getConfig().publicRuntimeConfig.authProviders, (configuration, type) => {
        if (AuthProviders[type] === undefined) {
            console.error(`Important: The configuration refers to an authentication provider "${type}" that could not be instantiated. Please ensure that the AuthProviders constant above refers to a valid provider file.`);
            return;
        }
        if (type === 'matrix' && typeof window !== 'undefined') {
            let baseUrl;
            if (window.localStorage.getItem('medienhaus_hs_url')) {
                baseUrl = window.localStorage.getItem('medienhaus_hs_url');
            } else {
                baseUrl = getConfig().publicRuntimeConfig.authProviders.matrix?.baseUrl ?? 'https://matrix.org';
            }
            return new (AuthProviders[type])({ ...configuration, type, baseUrl }, window.localStorage.getItem('medienhaus_user_id'), window.localStorage.getItem('medienhaus_access_token'));
        } else {
            return new (AuthProviders[type])({ ...configuration, type });
        }
    }));

    const signin = async (username, password, homeserver) => {
        const matrixAuthenticationResponse = await getAuthenticationProvider('matrix').signin(username, password, homeserver);

        window.localStorage.setItem('medienhaus_access_token', matrixAuthenticationResponse.access_token);

        if (matrixAuthenticationResponse.well_known?.['m.homeserver']) {
            // Set  window.localStorage items for medienhaus/
            window.localStorage.setItem('medienhaus_hs_url', matrixAuthenticationResponse.well_known['m.homeserver'].base_url);
            // Set window.localStorage items for the Element client to automatically be logged-in
            window.localStorage.setItem('mx_hs_url', matrixAuthenticationResponse.well_known['m.homeserver'].base_url);
        } else {
            window.localStorage.setItem('medienhaus_hs_url',homeserver);
            window.localStorage.setItem('mx_hs_url', homeserver);

        }

        // Set other window.localStorage items for medienhaus/
        window.localStorage.setItem('medienhaus_user_id', matrixAuthenticationResponse.user_id);

        // Set other window.localStorage items for the Element client to automatically be logged-in
        window.localStorage.setItem('mx_access_token', matrixAuthenticationResponse.access_token);
        window.localStorage.setItem('mx_home_server', matrixAuthenticationResponse.home_server);
        window.localStorage.setItem('mx_user_id', matrixAuthenticationResponse.user_id);
        window.localStorage.setItem('mx_device_id', matrixAuthenticationResponse.device_id);

        await fetchUserProfileAndStartClient();

        // Loop through all existing authentication providers and sign in
        Object.entries(activeAuthentications).forEach(([type, authentication]) => {
            // Skip the default Matrix auth provider
            if (type === 'matrix') return;
            authentication.signin(username, password).catch(() => {});
        });

        return matrixAuthenticationResponse;
    };

    const signout = useCallback(async () => {
        window.localStorage.removeItem('medienhaus_access_token');
        window.localStorage.removeItem('medienhaus_user_id');

        // Hydrate local storage for user to be automatically loggeed into potential Element installation on same host
        window.localStorage.removeItem('mx_access_token');
        window.localStorage.removeItem('mx_home_server');
        window.localStorage.removeItem('mx_hs_url');
        window.localStorage.removeItem('mx_user_id');
        window.localStorage.removeItem('mx_device_id');

        setUser(false);

        // Loop through all existing authentication providers and sign out
        Object.entries(activeAuthentications).forEach(([type, authentication]) => {
            // Skip the default Matrix auth provider
            if (type === 'matrix') return;
            authentication.signout();
        });
    }, [activeAuthentications]);

    const getAuthenticationProvider = useCallback((type) => {
        return activeAuthentications[type];
    }, [activeAuthentications]);

    const getActiveMatrixAuthentications = useCallback(() => pickBy(activeAuthentications, (authentication, type) => {
        return AuthProviders[type] === MatrixAuthProvider;
    }), [activeAuthentications]);

    const fetchUserProfileAndStartClient = useCallback(async () => {
        const profileInfoResponse = await getAuthenticationProvider('matrix').getMatrixClient().getProfileInfo(getAuthenticationProvider('matrix').getMatrixClient().getUserId());
        if (!profileInfoResponse) {
            return signout();
        }

        setUser(profileInfoResponse);
        return getAuthenticationProvider('matrix').startClient();
    }, [getAuthenticationProvider, signout]);

    // On app load we want to check if there's a valid access token in our localStorage already
    useEffect(() => {
        const checkIfStoredTokenIsValid = async () => {
            const whoAmIResponse = await getAuthenticationProvider('matrix').getMatrixClient().whoami();
            if (whoAmIResponse.user_id !== getAuthenticationProvider('matrix').getMatrixClient().getUserId()) {
                // For some reason the Matrix server told us we're someone else than the user ID in our local storage
                throw new Error('USERNAME_MISMATCH');
            }
            return fetchUserProfileAndStartClient();
        };

        if (localStorage.getItem('medienhaus_user_id') && localStorage.getItem('medienhaus_access_token')) {
            // Try to sign in using the stored access token; if anything goes wrong just sign out
            checkIfStoredTokenIsValid().catch(() => { signout(); });
        } else {
            setUser(false);
        }
    }, [fetchUserProfileAndStartClient, getAuthenticationProvider, signout]);

    return {
        user,
        signin,
        signout,
        getAuthenticationProvider,
        getActiveMatrixAuthentications,
    };
}

const AuthContext = createContext(undefined);

function useAuth() {
    return useContext(AuthContext);
}

export {
    AuthContext,
    useAuthProvider,
    useAuth,
};
