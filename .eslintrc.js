// const process = require('node:process')
// process.env.ESLINT_TSCONFIG = 'tsconfig.json'

module.exports = {
  env: {
    es6: true,
    node: true,
    mocha: true,
  },
  extends: '@antfu',
  plugins: ['mocha'],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    'no-console': 0,
    'one-var': 0,
    'comma-dangle': 0,
    'new-cap': 0,
    'padded-blocks': 0,
    'brace-style': [0, '1tbs', { allowSingleLine: true }],
    'object-shorthand': ['warn', 'consistent'],
    'antfu/if-newline': 0,
  },
}
