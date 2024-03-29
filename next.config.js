const SpacesConfig = require('./config.js');

module.exports = {
    publicRuntimeConfig: { ...SpacesConfig },
    compiler: {
        styledComponents: true,
    },
    rewrites: () => {
        const rewriteConfig = [
            {
                source: '/',
                destination: '/dashboard',
            },
        ];

        if (SpacesConfig.authProviders.etherpad) {
            rewriteConfig.push(
                {
                    source: SpacesConfig.authProviders.etherpad.path,
                    destination: '/etherpad',
                },
                {
                    source: SpacesConfig.authProviders.etherpad.path + '/:roomId',
                    destination: '/etherpad/:roomId',
                },
            );
        }

        if (SpacesConfig.authProviders.spacedeck) {
            rewriteConfig.push(
                {
                    source: SpacesConfig.authProviders.spacedeck.path,
                    destination: '/spacedeck',
                },
                {
                    source: SpacesConfig.authProviders.spacedeck.path + '/:roomId',
                    destination: '/spacedeck/:roomId',
                },
            );
        }

        if (SpacesConfig.authProviders.tldraw) {
            rewriteConfig.push(
                {
                    source: SpacesConfig.authProviders.tldraw.path,
                    destination: '/tldraw',
                },
                {
                    source: SpacesConfig.authProviders.tldraw.path + '/:roomId',
                    destination: '/tldraw/:roomId',
                },
            );
        }

        return rewriteConfig;
    },
};
