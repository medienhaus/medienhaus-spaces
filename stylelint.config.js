module.exports = {
    'files': ['assets/*.css', 'components/**/*.js', 'pages/**/*.js'],
    'rules': {
        'max-empty-lines': 1,
        'max-line-length': null,
        'string-quotes': 'single',
    },
    'overrides': [
        {
            'files': ['**/*.css'],
            'extends': [
                'stylelint-config-standard',
                'stylelint-config-recess-order',
            ],
        },
        {
            'files': ['**/*.js'],
            'customSyntax': '@stylelint/postcss-css-in-js',
            'extends': [
                'stylelint-config-standard',
                'stylelint-config-styled-components',
                'stylelint-config-recess-order',
            ],
            'rules': {
                'indentation': [2, { 'baseIndentLevel': 1 }],
                'no-empty-first-line': null,
                'no-invalid-double-slash-comments': null,
            },
        },
    ],
};
