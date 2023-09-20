import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import getConfig from 'next/config';
import _ from 'lodash';

import MatrixAuthProvider from './auth/MatrixAuthProvider';
import PeerTubeAuthProvider from './auth/PeerTubeAuthProvider';
import MyPadsAuthProvider from './auth/MyPadsAuthProvider';

/*
    Mapping of authentication provider types and which corresponding class should be used to actually perform
    any logic specifically related to the given authentication provider.

    You can define multiple authentication providers in the `next.config.js` file.
 */
const AuthProviders = {
    matrix: MatrixAuthProvider,
    peerTube: PeerTubeAuthProvider,
    etherpad: MyPadsAuthProvider,
};

function useAuthProvider() {
    const [user, setUser] = useState(null);
    const [activeAuthentications] = useState(_.mapValues(getConfig().publicRuntimeConfig.authProviders, (configuration, type) => {
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
            window.localStorage.setItem('medienhaus_hs_url', homeserver);
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

        await getAccessTokensFromAccountData(username, password);

        return matrixAuthenticationResponse;
    };

    const getAccessTokensFromAccountData = async (username, password) => {
        // we will use `getAccountDataFromServer` instead of `getAccountData` as we can nnot tell for sure if the sync is completly done and dont want to wait for that. So potentially this call is avoidable but it is more managable to handle it like this.
        const accessTokens = await getAuthenticationProvider('matrix').getMatrixClient().getAccountDataFromServer('dev.medienhaus.spaces.accesstokens');
        let dataChanged = false;

        if (!accessTokens) {
            // fetch did not worked or this accountData state event is not set yet. In either way we want to create it.
            // First we need to login all of the Services

            dataChanged = true;
        } else {
            for await (const [type, authentication] of Object.entries(activeAuthentications)) {
                // Skip the default Matrix auth provider
                if (type === 'matrix') continue;

                if (accessTokens[type]) {
                    authentication.addToken(accessTokens[type]);
                    if (await authentication.validateToken()) {
                        // everything seems to work out as expected we will cut here
                        continue;
                    }
                }
                // if the stored token does not work anymore then we will execute a login procedure and store the new generated accesstoken
                if (! await authentication.validateToken().catch(() => { })) {
                    dataChanged = true;
                    accessTokens[type] = await authentication.signin(username, password).catch(() => { });
                }
            }
        }

        if (dataChanged) {
            // write accessTokensToAccountData
            await getAuthenticationProvider('matrix').getMatrixClient().setAccountData('dev.medienhaus.spaces.accesstokens', accessTokens);
        }
    };

    const signout = useCallback(async () => {
        window.localStorage.removeItem('medienhaus_access_token');
        window.localStorage.removeItem('medienhaus_user_id');
        window.localStorage.removeItem('medienhaus_hs_url');

        // remove localStorage items we've previously set
        window.localStorage.removeItem('mx_access_token');
        window.localStorage.removeItem('mx_home_server');
        window.localStorage.removeItem('mx_hs_url');
        window.localStorage.removeItem('mx_user_id');
        window.localStorage.removeItem('mx_device_id');

        // Loop through all existing authentication providers and sign out
        Object.entries(activeAuthentications).forEach(([type, authentication]) => {
            authentication.signout();
            setUser(false);
        });
    }, [activeAuthentications]);

    const getAuthenticationProvider = useCallback((type) => {
        return activeAuthentications[type];
    }, [activeAuthentications]);

    const getActiveAuthenticationsByType = useCallback((typeToLookFor) => _.pickBy(activeAuthentications, (authentication, type) => {
        return AuthProviders[type] === typeToLookFor;
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
        getActiveAuthenticationsByType,
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
