module.exports = {
  env: {
    node: true
  },

  extends: [
    'eslint:recommended',
    'standard'
  ],

  rules: {
    'comma-dangle': ['error', 'only-multiline'],

    'max-len': ['error', {
      code: 80
    }],

    'space-before-function-paren': ['error', {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always'
    }]
  }
}
