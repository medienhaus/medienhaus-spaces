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
            write: {
                baseUrl: 'https://pad.klasseklima.dev/p',
                api: 'https://pad.klasseklima.dev/mypads/api',
            },
        },
        contextRootSpaceRoomId: '!gB.....Ewlvdq:matrix.org',
        account: {
            allowAddingNewEmails: true,
        },
        chat: {
            pathToElement: '//localhost/element',
        },
    },
    webpack: WebpackConfig,
};
