const MatrixPrettierConfig = require('eslint-plugin-matrix-org/.prettierrc.js');

/**
 * We build upon the matrix-org Prettier configuration, with only a few customizations.
 *
 * @type {import('prettier').Config}
 */
module.exports = {
    ...MatrixPrettierConfig,
    printWidth: 140, // Slightly more lax setting than what Matrix is doing; should be re-adjusted later
    singleQuote: true, // In non-JSX JavaScript code prefer single quotes over double quotes
};
