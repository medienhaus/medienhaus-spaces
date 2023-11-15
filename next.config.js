const StylelintPlugin = require('stylelint-webpack-plugin');

const SpacesConfig = require('./config.js');

module.exports = {
    publicRuntimeConfig: { ...SpacesConfig },
    compiler: {
        styledComponents: true,
    },
    output: 'standalone',
    rewrites: () => {
        const rewriteConfig = [
            {
                source: '/',
                destination: '/dashboard',
            },
        ];

        if (SpacesConfig.authProviders.etherpad) {
            rewriteConfig.push({
                source: SpacesConfig.authProviders.etherpad.path,
                destination: '/etherpad',
            },
            {
                source: SpacesConfig.authProviders.etherpad.path + '/:roomId',
                destination: '/etherpad/:roomId',
            });
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
                });
        }

        return rewriteConfig;
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        if (!dev || isServer) return config;

        config.plugins.push(new StylelintPlugin({
            files: ['assets/*.css', 'components/**/*.js', 'pages/**/*.js'],
            failOnError: false,
        }));

        return config;
    },
};
