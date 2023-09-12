const StylelintPlugin = require('stylelint-webpack-plugin');

const SpacesConfig = require('./config.js');

module.exports = {
    publicRuntimeConfig: { ...SpacesConfig },
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
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        if (!dev || isServer) return config;

        config.plugins.push(new StylelintPlugin({
            files: ['assets/*.css', 'components/**/*.js', 'pages/**/*.js'],
            failOnError: false,
        }));

        return config;
    },
};
