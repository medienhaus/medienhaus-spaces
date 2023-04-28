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
            write: {
                baseUrl: 'https://pad.riseup.net/p',
                api: 'https://pad.riseup.net/mypads/api',
            },
            sketch: {
                baseUrl: 'https://sketch.yourserver.org',
                bypassUrlValidation: false,
            },
        },
        contextRootSpaceRoomId: '!gB.....Ewlvdq:matrix.org',
        account: {
            allowAddingNewEmails: true,
        },
    },
    webpack: WebpackConfig,
};
