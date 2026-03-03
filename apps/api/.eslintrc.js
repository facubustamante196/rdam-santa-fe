module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    env: {
        node: true,
        es2021: true,
        jest: true,
    },
    plugins: ['@typescript-eslint', 'prettier'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
    ignorePatterns: ['dist/', 'node_modules/'],
    rules: {
        'prettier/prettier': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-empty': 'off',
    },
};
