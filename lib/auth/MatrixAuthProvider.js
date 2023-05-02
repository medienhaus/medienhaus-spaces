/*
    This class provides a medienhaus/ authentication mechanism with one specific Matrix server.
 */

import matrixcs, { Filter } from 'matrix-js-sdk';
import getConfig from 'next/config';

class MatrixAuthProvider {
    constructor(configuration, userId, accessToken) {
        this.configuration = configuration;
        // eslint-disable-next-line new-cap
        this.matrixClient = new matrixcs.createClient({
            baseUrl: configuration.baseUrl,
            accessToken: accessToken,
            userId: userId,
            useAuthorizationHeader: true,
            timelineSupport: true,
            unstableClientRelationAggregation: true,
        });
    }

    async signin(username, password, homeserver) {
        this.configuration = { ...this.configuration, baseUrl: homeserver };

        if (homeserver !== this.matrixClient.getHomeserverUrl()) {
            // eslint-disable-next-line new-cap
            this.matrixClient = new matrixcs.createClient({
                baseUrl: homeserver,
                userId: username,
                useAuthorizationHeader: true,
                timelineSupport: true,
                unstableClientRelationAggregation: true,
            });
        }

        return this.matrixClient.login('m.login.password', {
            type: 'm.login.password',
            user: username,
            password: password,
            initial_device_display_name: getConfig().publicRuntimeConfig.name,
        });
    }

    async signout() {
        this.matrixClient.stopClient();
        // @TODO
    }

    startClient() {
        // We filter out all presence events of other users; we do not care about those right now
        const filter = new Filter(this.matrixClient.getUserId());
        filter.setDefinition({
            presence: {
                not_types: [
                    '*',
                ],
            },
        });

        return this.matrixClient.startClient({
            lazyLoadMembers: true,
            filter: filter,
        });
    }

    /**
     * @returns {MatrixClient}
     */
    getMatrixClient() {
        return this.matrixClient;
    }
}

export default MatrixAuthProvider;
