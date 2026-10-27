const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  {
    // User-facing text must come from i18n keys, never from JSX literals.
    files: ["app/**/*.tsx", "src/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
    rules: {
      "react/jsx-no-literals": ["error", { noStrings: true, allowedStrings: ["•", "/", "·"] }],
      "no-console": "error",
    },
  },
]);
