import matrixcs from 'matrix-js-sdk';

class Matrix {
    constructor(baseUrl, userId, accessToken) {
        // eslint-disable-next-line new-cap
        this.matrixClient = new matrixcs.createClient({
            baseUrl: baseUrl,
            accessToken: accessToken,
            userId: userId,
            useAuthorizationHeader: true,
            timelineSupport: true,
        });
    }

    getMatrixClient() {
        return this.matrixClient;
    }

    async login(user, password) {
        return this.matrixClient.login('m.login.password', {
            type: 'm.login.password',
            user: user,
            password: password,
        });
    }
}

export default Matrix;
