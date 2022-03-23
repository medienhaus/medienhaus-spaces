import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import getConfig from 'next/config';
import { mapValues, pickBy } from 'lodash';

import MatrixAuthProvider from './auth/MatrixAuthProvider';
import PeerTubeAuthProvider from './auth/PeerTubeAuthProvider';

/*
    Mapping of authentication provider types and which corresponding class should be used to actually perform
    any logic specifically related to the given authentication provider.

    You can define multiple authentication providers in the `next.config.js` file.
 */
const AuthProviders = {
    matrix: MatrixAuthProvider,
    matrixContentStorage: MatrixAuthProvider,
    peerTube: PeerTubeAuthProvider,
};

function useAuthProvider(callback, deps) {
    const [user, setUser] = useState(null);
    const [activeAuthentications] = useState(mapValues(getConfig().publicRuntimeConfig.authProviders, (configuration, type) => {
        if (type === 'matrix' && typeof window !== 'undefined') {
            return new (AuthProviders[type])({ ...configuration, type }, window.localStorage.getItem('medienhaus_user_id'), window.localStorage.getItem('medienhaus_access_token'));
        } else {
            return new (AuthProviders[type])({ ...configuration, type });
        }
    }));

    const signin = async (username, password) => {
        const matrixAuthenticationResponse = await getAuthenticationProvider('matrix').signin(username, password).then((response) => {
            // Set window.localStorage items for medienhaus/
            window.localStorage.setItem('medienhaus_access_token', response.access_token);
            window.localStorage.setItem('medienhaus_user_id', response.user_id);

            // Set window.localStorage items for the Element client to automatically be logged-in
            window.localStorage.setItem('mx_access_token', response.access_token);
            window.localStorage.setItem('mx_home_server', response.home_server);
            window.localStorage.setItem('mx_hs_url', response.well_known['m.homeserver'].base_url);
            window.localStorage.setItem('mx_user_id', response.user_id);
            window.localStorage.setItem('mx_device_id', response.device_id);
        });

        await fetchAndSetUserData();
        getAuthenticationProvider('matrix').startClient();

        // Loop through all existing authentication providers and sign in
        Object.entries(activeAuthentications).forEach(([type, authentication]) => {
            // Skip the default Matrix auth provider
            if (type === 'matrix') return;

            authentication.signin(username, password).catch(() => {});
        });

        return matrixAuthenticationResponse;
    };

    const signout = async () => {
        window.localStorage.removeItem('medienhaus_access_token');
        window.localStorage.removeItem('medienhaus_user_id');

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
    };

    const getAuthenticationProvider = useCallback((type) => {
        return activeAuthentications[type];
    }, [activeAuthentications]);

    const getActiveMatrixAuthentications = useCallback(() => pickBy(activeAuthentications, (authentication, type) => {
        return AuthProviders[type] === MatrixAuthProvider;
    }), [activeAuthentications]);

    const fetchAndSetUserData = useCallback(async () => {
        return getAuthenticationProvider('matrix').getMatrixClient().getAccountDataFromServer().then(async () => {
            const profile = await getAuthenticationProvider('matrix').getMatrixClient().getProfileInfo(localStorage.getItem('medienhaus_user_id'));
            if (profile) {
                setUser(profile);
            } else {
                setUser(false);
            }
        }).catch((error) => {
            setUser(false);
        });
    }, [getAuthenticationProvider]);

    useEffect(() => {
        (async () => {
            if (localStorage.getItem('medienhaus_user_id') && localStorage.getItem('medienhaus_access_token')) {
                await fetchAndSetUserData();
                getAuthenticationProvider('matrix').startClient();
            } else {
                setUser(false);
            }
        })();
    }, [fetchAndSetUserData, getAuthenticationProvider]);

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
