import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import getConfig from 'next/config';
import _ from 'lodash';
import { useImmer } from 'use-immer';

import MatrixAuthProvider from './auth/MatrixAuthProvider';
import PeerTubeAuthProvider from './auth/PeerTubeAuthProvider';
import MyPadsAuthProvider from './auth/MyPadsAuthProvider';
import SpacedeckAuthProvider from './auth/SpacedeckAuthProvider';
import TldrawAuthProvider from '@/lib/auth/TldrawAuthProvider';

/*
    Mapping of authentication provider types and which corresponding class should be used to actually perform
    any logic specifically related to the given authentication provider.

    You can define multiple authentication providers in the `config.js` file.
 */
const AuthProviders = {
    matrix: MatrixAuthProvider,
    peerTube: PeerTubeAuthProvider,
    etherpad: MyPadsAuthProvider,
    spacedeck: SpacedeckAuthProvider,
    tldraw: TldrawAuthProvider,
};

function useAuthProvider() {
    const [user, setUser] = useImmer(null);
    const [connectionStatus, setConnectionStatus] = useImmer({});
    const updateConnectionStatus = useCallback(
        (service, status) => {
            return setConnectionStatus((prevState) => {
                prevState[service] = status; // status is in this case a boolean

                return prevState;
            });
        },
        [setConnectionStatus],
    );
    const [activeAuthentications] = useState(
        _(getConfig().publicRuntimeConfig.authProviders || { matrix: {} })
            .mapValues((configuration, type) => {
                if (AuthProviders[type] === undefined) {
                    console.error(
                        `Important: The configuration refers to an authentication provider "${type}" that could not be instantiated. Please ensure that the AuthProviders constant above refers to a valid provider file.`,
                    );

                    return;
                }

                if (type === 'matrix' && typeof window !== 'undefined') {
                    let baseUrl;

                    if (window.localStorage.getItem('medienhaus_hs_url')) {
                        baseUrl = window.localStorage.getItem('medienhaus_hs_url');
                    } else {
                        baseUrl = getConfig().publicRuntimeConfig.authProviders?.matrix?.baseUrl ?? 'https://matrix.org';
                    }

                    return new AuthProviders[type](
                        { ...configuration, type, baseUrl },
                        window.localStorage.getItem('medienhaus_user_id'),
                        window.localStorage.getItem('medienhaus_access_token'),
                    );
                } else {
                    return new AuthProviders[type]({ ...configuration, type }, updateConnectionStatus);
                }
            })
            .pickBy() // Filter out providers from the resulting object that are `undefined` because we don't know about them (see above)
            .value(),
    );

    const getAuthenticationProvider = useCallback(
        (type) => {
            return activeAuthentications[type];
        },
        [activeAuthentications],
    );

    const getActiveAuthenticationsByType = useCallback(
        (typeToLookFor) =>
            _.pickBy(activeAuthentications, (authentication, type) => {
                return AuthProviders[type] === typeToLookFor;
            }),
        [activeAuthentications],
    );

    const signout = useCallback(async () => {
        // 1. Loop through all existing authentication providers and sign out
        Object.entries(activeAuthentications).forEach(([type, authentication]) => {
            // Skip the default Matrix auth provider; we sign out of that at the very end
            if (type === 'matrix') return;

            authentication.signout();
        });

        // 2. "Save" to our Matrix account that all of the access tokens are probably invalid now
        await getAuthenticationProvider('matrix')
            .getMatrixClient()
            .deleteAccountData('dev.medienhaus.spaces.accesstokens')
            .catch(() => {});

        // 3. Sign out of Matrix
        await getAuthenticationProvider('matrix')
            .getMatrixClient()
            .logout(true)
            .catch(() => {});

        // 4. Clean up our local storage items we've previously set
        window.localStorage.removeItem('medienhaus_access_token');
        window.localStorage.removeItem('medienhaus_user_id');
        window.localStorage.removeItem('medienhaus_hs_url');

        window.localStorage.removeItem('mx_access_token');
        window.localStorage.removeItem('mx_home_server');
        window.localStorage.removeItem('mx_hs_url');
        window.localStorage.removeItem('mx_user_id');
        window.localStorage.removeItem('mx_device_id');

        // 5. Update our inner React state to reflect all of the above
        setUser(false);
    }, [activeAuthentications, getAuthenticationProvider, setUser]);

    const fetchUserProfileAndStartClient = useCallback(async () => {
        const profileInfoResponse = await getAuthenticationProvider('matrix')
            .getMatrixClient()
            .getProfileInfo(getAuthenticationProvider('matrix').getMatrixClient().getUserId());

        if (!profileInfoResponse) {
            return signout();
        }

        /* @NOTE: clear(!) client-side localStorage if value defined in `versionToken` is */
        /* *not_equal* to value stored in or does *not_exist* in client-side localStorage */
        if (
            getConfig().publicRuntimeConfig.localStorage?.clearAfterUpgrade &&
            getConfig().publicRuntimeConfig.localStorage?.versionToken &&
            localStorage.getItem('versionToken') !== getConfig().publicRuntimeConfig.localStorage.versionToken
        ) {
            localStorage.setItem('versionToken', getConfig().publicRuntimeConfig.localStorage.versionToken);

            return signout();
        }

        setUser(profileInfoResponse);

        return getAuthenticationProvider('matrix').startClient();
    }, [getAuthenticationProvider, setUser, signout]);

    /**
     * @param {string} username
     * @param {string} password
     *
     * @returns {Promise<void>}
     */
    const signIntoAllAuthProviders = useCallback(
        async (username, password) => {
            const accessTokens = {};

            for await (const [type, authentication] of Object.entries(activeAuthentications)) {
                // Skip the default Matrix auth provider
                if (type === 'matrix') continue;

                // @TODO Tidy up these "updateConnectionStatus" calls... they happen in too many different places
                updateConnectionStatus(type, false);

                // if the stored token does not work anymore then we will execute a login procedure and store the new generated access token
                const token = await authentication.signin(username, password).catch(() => {});

                if (token) {
                    accessTokens[type] = token;
                    updateConnectionStatus(type, true);
                }
            }

            // Write access tokens to Matrix account data
            await getAuthenticationProvider('matrix').getMatrixClient().setAccountData('dev.medienhaus.spaces.accesstokens', accessTokens);
        },
        [activeAuthentications, getAuthenticationProvider, updateConnectionStatus],
    );

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

        await signIntoAllAuthProviders(username, password);

        return matrixAuthenticationResponse;
    };

    // On app load we want to check if there's a valid access token in our localStorage already
    useEffect(() => {
        const checkIfStoredTokenIsValid = async () => {
            const whoAmIResponse = await getAuthenticationProvider('matrix').getMatrixClient().whoami();

            if (whoAmIResponse.user_id !== getAuthenticationProvider('matrix').getMatrixClient().getUserId()) {
                // For some reason the Matrix server told us we're someone else than the user ID in our local storage
                throw new Error('USERNAME_MISMATCH');
            }

            // Load access tokens for all authentication providers from our Matrix account data and validate each one
            const accessTokens =
                (await getAuthenticationProvider('matrix')
                    .getMatrixClient()
                    .getAccountDataFromServer('dev.medienhaus.spaces.accesstokens')) || {};

            // @TODO
            // Do we wanna check for presence of -all- auth providers that we know of?
            // And if there's not one for each... then automatically /logout maybe?

            for await (const [type, authentication] of Object.entries(activeAuthentications)) {
                // Skip the default Matrix auth provider
                if (type === 'matrix') continue;

                if (accessTokens[type]) {
                    authentication.setToken(accessTokens[type]);
                    const tokenValidation = await authentication.validateToken().catch(() => {});

                    if (tokenValidation) {
                        // if the token is valid we set the connection status 'true' and continue
                        updateConnectionStatus(type, true);
                    }
                }
            }

            return fetchUserProfileAndStartClient();
        };

        if (localStorage.getItem('medienhaus_user_id') && localStorage.getItem('medienhaus_access_token')) {
            // Try to sign in using the stored access token; if anything goes wrong just sign out
            checkIfStoredTokenIsValid().catch(() => {
                signout();
            });
        } else {
            setUser(false);
        }
    }, [activeAuthentications, fetchUserProfileAndStartClient, getAuthenticationProvider, setUser, signout, updateConnectionStatus]);

    return {
        user,
        connectionStatus,
        updateConnectionStatus,
        signin,
        signout,
        getAuthenticationProvider,
        getActiveAuthenticationsByType,
        validateAuthProvidersAccessTokens: signIntoAllAuthProviders,
    };
}

const AuthContext = createContext(undefined);

function useAuth() {
    return useContext(AuthContext);
}

export { AuthContext, useAuthProvider, useAuth };
