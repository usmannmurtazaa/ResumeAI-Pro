module.exports = {
  extends: ['react-app'],
  plugins: ['unused-imports'],
  rules: {
    'import/first': 'warn',
    'no-undef': 'warn',
    'react/jsx-no-undef': 'warn',

    // Replace base rule with plugin version so `--fix` can remove unused imports.
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
};