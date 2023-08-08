/* eslint-env node */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  ignorePatterns: ["node_modules/", "dist/", ".eslintrc.js"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:unicorn/recommended",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "prettier/prettier": "error",
    "unicorn/prevent-abbreviations": "off",
  },
};
