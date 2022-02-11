/*
    This class provides a medienhaus/ authentication mechanism with one specific Matrix server.
 */
import Matrix from '../Matrix';

class MatrixAuthProvider {
    constructor(configuration, userId, accessToken) {
        this.configuration = configuration;
        this.matrixClient = new Matrix(configuration.baseUrl, userId, accessToken);
    }

    async signin(username, password) {
        return this.matrixClient.login(username, password);
    }

    async signout() {
        this.matrixClient.getMatrixClient()?.stopClient();
        // @TODO
    }

    getMatrixClient() {
        return this.matrixClient.getMatrixClient();
    }
}

export default MatrixAuthProvider;
