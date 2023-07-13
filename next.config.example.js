const WebpackConfig = require('./webpack.config.js');

// eslint-disable-next-line no-undef
module.exports = {
    publicRuntimeConfig: {
        name: '/spaces',
        authProviders: {
            matrix: {
                baseUrl: 'https://matrix.org',
                allowCustomHomeserver: true,
            },
            matrixContentStorage: {
                baseUrl: 'https://second.matrixserver.org',
            },
            etherpad: {
                path: '/write',
                baseUrl: 'https://pad.riseup.net/p',
                // api: 'https://your.etherpadserver.org/mypads/api',
                // spacesGroupName: '/spaces'
            },
            sketch: {
                baseUrl: 'https://sketch.yourserver.org',
            },
        },
        contextRootSpaceRoomId: '!gB.....Ewlvdq:matrix.org',
        account: {
            allowAddingNewEmails: true,
        },
    },
    async rewrites() {
        return [
            {
                source: this.publicRuntimeConfig.authProviders.etherpad.path,
                destination: '/etherpad',
            },
            {
                source: this.publicRuntimeConfig.authProviders.etherpad.path + '/:roomId',
                destination: '/etherpad/:roomId',
            },
        ];
    },
    webpack: WebpackConfig,
};
