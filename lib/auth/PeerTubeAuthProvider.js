/*
    This class provides a medienhaus/ authentication mechanism for a given PeerTube instance.
 */
class PeerTubeAuthProvider {
    constructor(configuration) {
        this.configuration = configuration;
        // this.peerTubeClient = ...
    }

    async signin(username, password) {
        // @TODO
    }
}

export default PeerTubeAuthProvider;
