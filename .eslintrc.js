module.exports = {
  // To give you an idea how to override rule options:
  parser: "babel-eslint",
  parserOptions: {
    sourceType: "module",
  },
  extends: ["eslint:recommended"],
  env: {
    "browser": true,
    "node": true,
    "es6": true,
    "mocha": true,
  },
  rules: {
    "quotes": [2, "double", "avoid-escape"],
    "semi": [2],
    "no-unused-vars": [1, {"vars": "all", "args": "after-used"}],
    "no-return-await": [1],
  }
};
