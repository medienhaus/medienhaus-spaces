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
            etherpadMyPads: {
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
    webpack: WebpackConfig,
};
