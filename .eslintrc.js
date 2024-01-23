// .eslintrc.js
module.exports = {
    parserOptions: {
        ecmaVersion: 2020, // or 6, 7, 8, 9, 10, 11
        sourceType: 'module', // allows the use of imports
        ecmaFeatures: {
            jsx: true, // allows the use of JSX
        },
    },
    settings: {
        'import/resolver': {
            alias: {
                map: [
                    ['@', './'],
                ],
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
};
