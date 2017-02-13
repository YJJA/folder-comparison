module.exports = {
  extends: 'standard',
  parser: 'babel-eslint',
  "globals": {
    it: true,
    expect: true,
    beforeAll: true,
    afterAll: true,
    beforeEach: true,
    afterEach: true
  },
  env: {
    "browser": true,
    "node": true
  },
  rules: {
    "space-before-function-paren": "off",
    "no-unused-vars": "off"
  }
};
