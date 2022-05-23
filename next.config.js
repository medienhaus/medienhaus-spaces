const WebpackConfig = require('./webpack.config.js');

// eslint-disable-next-line no-undef
module.exports = {
    publicRuntimeConfig: {
        name: 'udk/spaces',
        authProviders: {
            matrix: {
                baseUrl: 'https://dev.medienhaus.udk-berlin.de',
                allowCustomHomeserver: true,
            },
            matrixContentStorage: {
                baseUrl: 'https://content.udk-berlin.de',
            },
            write: {
                baseUrl: 'https://pad.klasseklima.dev/p',
                api: 'https://pad.klasseklima.dev/mypads/api',
            },
        },
        contextRootSpaceRoomId: '!pwCcubmjqBIdIMqLRd:dev.medienhaus.udk-berlin.de',
        account: {
            allowAddingNewEmails: true,
        },
    },
    webpack: WebpackConfig,
};
