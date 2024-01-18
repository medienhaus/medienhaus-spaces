import _ from 'lodash';
class TldrawAuthProvider {
    constructor(configuration, updateConnectionStatus) {
        this.allSpaces = {};
        this.allFolder = {};
        this.structure = {};
        this.url = configuration.baseUrl;
        this.updateConnectionStatus= updateConnectionStatus;
    }

    setToken(token) {
        this.token = token;
    }

    async makeRequest(resource, options) {

    }

    async validateToken() {

    }

    async signin(usr, pwd) {

    }

    async signout() {

    }

    async _getInitialUserData() {

    }
}

export default TldrawAuthProvider;
