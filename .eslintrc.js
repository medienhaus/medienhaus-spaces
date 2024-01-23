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
    plugins: [
        'matrix-org',
    ],
    extends: [
        'next',
        'plugin:matrix-org/javascript',
        'plugin:matrix-org/a11y',
        'plugin:matrix-org/react',
        'plugin:import/recommended',
    ],
    env: {
        'es6': true,
    },
    rules: {
        'padding-line-between-statements': [
            'error',
            {
                'blankLine': 'always',
                'prev': '*',
                'next': 'return',
            },
            {
                'blankLine': 'always',
                'prev': '*',
                'next': 'export',
            },
            {
                'blankLine': 'always',
                'prev': '*',
                'next': 'multiline-block-like',
            },
            {
                'blankLine': 'always',
                'prev': 'multiline-block-like',
                'next': '*',
            },
        ],
        'max-len': 'off',
        'jsx-quotes': [
            'error',
            'prefer-double',
        ],
    },
    settings: {
        'import/resolver': {
            'alias': {
                'map': [
                    ['@', './'],
                ],
                'extensions': ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
};
