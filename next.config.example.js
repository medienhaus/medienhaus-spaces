const WebpackConfig = require('./webpack.config.js');

module.exports = {
    publicRuntimeConfig: {
        // @TODO could be name appName or appTitle (even though I like name the most)
        name: '/spaces',
        // @TODO array or object ???
        // @TODO first is always default ???
        authProviders: {
            matrix: {
                baseUrl: 'https://matrix.org',
                // @TODO what's api for in /spaces, and where to define ???
                // api: 'https://api.dev.medienhaus.udk-berlin.de',
                allowCustomHomeserver: false,
            },
            // @TODO not affected by allowCustomHomeserver; should maybe be
            // disabled / overwritten if custom homeserver is specified ???
            // also the term (matrix) content storage is somewhat ambiguous
            matrixContentStorage: {
                baseUrl: 'https://matrix.example.org',
            },
            etherpadMyPads: {
                // @TODO i don't like the /mypads/api here
                // (also see etherpad baseUrl below in line 74)
                baseUrl: 'https://etherpad.example.org/mypads/api',
            },
            spacedeck: {
                baseUrl: 'https://spacedeck.example.org',
            },
        },
        serviceRoutes: {
            account: {
                enabled: true,
                // @TODO i don't really like this option as it's basically matrix-only and not synced
                // @TODO account management should probably be done in the auth provider (like ldap)
                allowAddingNewEmails: false,
                path: '/account',
            },
            dashboard: {
                enabled: true,
                bookmarks: true,
                invites: true,
            },
            explore: {
                enabled: true,
                // @TODO can we please rename this key ???
                contextRootSpaceRoomId: '!rnd...:matrix.org',
                templates: {
                    context: [
                        'seminar',
                    ],
                    item: [
                        // @TODO
                        // for each serviceRoutes.itemTemplate? ... {
                        //   this.publicRuntimeConfig.serviceRoutes.element.template,
                        //   this.publicRuntimeConfig.serviceRoutes.etherpad.template,
                        //   this.publicRuntimeConfig.serviceRoutes.spacedeck.template,
                        // }
                        'studentproject',
                    ],
                },
            },
            element: {
                enabled: true,
                baseUrl: '//localhost/element',
                path: '/chat',
                template: 'chat-link',
            },
            etherpad: {
                enabled: true,
                // @TODO i don't like the /p here as it is important because
                // ... it really depends on the etherpad nginx configuration
                baseUrl: 'https://etherpad.example.org/p',
                path: '/write',
                template: 'etherpad-link',
            },
            spacedeck: {
                enabled: true,
                baseUrl: 'https://spacedeck.example.org',
                path: '/sketch',
                template: 'spacedeck-link',
            },
            logout: {
                // @NOTE in case someone wants this as signout or signoff or goodbye or whatever
                path: '/logout',
            },
        },
        localization: [
            'en',
            'de',
        ],
        copyleft: {
            hidden: false,
        },
        chat: {
            pathToElement: '//localhost/element',
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
            rewriteConfig.push({
                source: this.publicRuntimeConfig.authProviders.spacedeck.path,
                destination: '/spacedeck',
            },
            {
                source: this.publicRuntimeConfig.authProviders.spacedeck.path + '/:roomId',
                destination: '/spacedeck/:roomId',
            });
        }

        // @TODO we'd need these for all serviceRoutes as well
        // @TODO and probably independent of authProvider

        return rewriteConfig;
    },
    webpack: WebpackConfig,
};
