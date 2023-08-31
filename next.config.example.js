const WebpackConfig = require('./webpack.config.js');

module.exports = {
    publicRuntimeConfig: {
        name: '/spaces',
        authProviders: {
            matrix: {
                baseUrl: 'https://matrix.org',
                allowCustomHomeserver: true,
            },
            etherpad: {
                path: '/write',
                baseUrl: 'https://pad.riseup.net/p',
                myPads: {
                    api: 'http://etherpad.localhost/mypads/api',
                    spacesGroupName: '/spaces', // optional, defaults to publicRuntimeConfig.name
                },
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
