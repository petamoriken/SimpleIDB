module.exports = {
  // To give you an idea how to override rule options:
  parser: "babel-eslint",
  parserOptions: {
    sourceType: "module"
  },
  extends: ["eslint:recommended"],
  env: {
    "browser": true,
    "es6": true,
  },
  rules: {
    "quotes": [2, "double", "avoid-escape"],
    "no-console": [0],
    "no-unused-vars": [1, {"vars": "all", "args": "after-used"}],
    "no-return-await": [1],
    "eol-last": [0],
    "no-mixed-requires": [0],
    "no-underscore-dangle": [0]
  }
};