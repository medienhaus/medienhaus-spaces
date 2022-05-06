const StylelintPlugin = require('stylelint-webpack-plugin');

module.exports = (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev || isServer) return config;

    config.plugins.push(new StylelintPlugin({
        files: ['assets/*.css', 'components/**/*.js', 'pages/**/*.js'],
        failOnError: false,
    }));
    return config;
};
