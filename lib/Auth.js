import React, { createContext, useContext, useEffect, useState } from 'react';
import getConfig from 'next/config';
import { mapValues } from 'lodash';

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

function useAuthProvider() {
    const [user, setUser] = useState(null);
    const [activeAuthentications] = useState(mapValues(getConfig().publicRuntimeConfig.authProviders, (configuration, type) => {
        if (type === 'matrix' && typeof window !== 'undefined') {
            return new (AuthProviders[type])({ ...configuration, type }, window.localStorage.getItem('medienhaus_user_id'), window.localStorage.getItem('medienhaus_access_token'));
        } else {
            return new (AuthProviders[type])({ ...configuration, type });
        }
    }));

    const signin = async (username, password) => {
        const matrixAuthenticationResponse = await activeAuthentications.matrix.signin(username, password).then((response) => {
            // Set window.localStorage items for medienhaus/
            window.localStorage.setItem('medienhaus_access_token', response.access_token);
            window.localStorage.setItem('medienhaus_user_id', response.user_id);

            // Set window.localStorage items for the Element client to automatically be logged-in
            window.localStorage.setItem('mx_access_token', response.access_token);
            window.localStorage.setItem('mx_home_server', response.home_server);
            window.localStorage.setItem('mx_hs_url', response.well_known['m.homeserver'].base_url);
            window.localStorage.setItem('mx_user_id', response.user_id);
            window.localStorage.setItem('mx_device_id', response.device_id);
        }).catch((error) => {
            throw error;
        });

        // Loop through all existing authentication providers and sign in
        Object.entries(activeAuthentications).forEach(([type, authentication]) => {
            // Skip the default Matrix auth provider
            if (type === 'matrix') return;

            authentication.signin(username, password);
        });

        return matrixAuthenticationResponse;
    };

    const signout = async () => {
        // @TODO
    };

    const getAuthenticationProvider = (type) => {
        return activeAuthentications[type];
    };

    const fetchAndSetUserData = (callback) => {
        getAuthenticationProvider('matrix').getMatrixClient().getProfileInfo(localStorage.getItem('medienhaus_user_id')).then((profile) => {
            if (profile) {
                setUser(profile);
            } else {
                setUser(false);
            }
            if (callback) { callback(); }
        }).catch((error) => {
            setUser(false);
        });
    };

    useEffect(() => {
        if (localStorage.getItem('medienhaus_user_id') && localStorage.getItem('medienhaus_access_token')) {
            fetchAndSetUserData();
        } else {
            setUser(false);
        }
    }, []);

    return {
        user,
        signin,
        signout,
        getAuthenticationProvider,
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
