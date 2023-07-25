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
                myPads: {
                    api: 'http://etherpad.localhost/mypads/api',
                    spacesGroupName: '/spaces', // optional, defaults to publicRuntimeConfig.name

                },
            },
            spacedeck: {
                path: '/sketch',
                baseUrl: 'http://spacedeck.localhost',
            },
        },
        templates: {
            context: ['seminar'],
            item: ['chat-link', 'write-link', 'sketch-link', 'studentproject'],
        },

        contextRootSpaceRoomId: '!gB.....Ewlvdq:matrix.org',
        account: {
            allowAddingNewEmails: true,
        },
    },
    rewrites() {
        const rewriteConfig = [];

        if (this.publicRuntimeConfig.authProviders.etherpad) {
            rewriteConfig.push({
                source: this.publicRuntimeConfig.authProviders.etherpad.path,
                destination: '/etherpad',
            },
            {
                source: this.publicRuntimeConfig.authProviders.etherpad.path + '/:roomId',
                destination: '/etherpad/:roomId',
            });
        }
        if (this.publicRuntimeConfig.authProviders.spacedeck) {
            rewriteConfig.push(
                {
                    source: this.publicRuntimeConfig.authProviders.spacedeck.path,
                    destination: '/spacedeck',
                },
                {
                    source: this.publicRuntimeConfig.authProviders.spacedeck.path + '/:roomId',
                    destination: '/spacedeck/:roomId',
                });
        }

        return rewriteConfig;
    },
    webpack: WebpackConfig,
};
