/*
    This class provides a medienhaus/ authentication mechanism with one specific Matrix server.
 */

import matrixcs from 'matrix-js-sdk';

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

    async signin(username, password) {
        return this.matrixClient.login('m.login.password', {
            type: 'm.login.password',
            user: username,
            password: password,
        });
    }

    async signout() {
        this.matrixClient.stopClient();
        // @TODO
    }

    startClient() {
        return this.matrixClient.startClient();
    }

    /**
     * @returns {MatrixClient}
     */
    getMatrixClient() {
        return this.matrixClient;
    }
}

export default MatrixAuthProvider;
