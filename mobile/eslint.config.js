const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", ".expo/*"],
  },
  {
    rules: { "import/no-named-as-default-member": "off" },
  },
  {
    // User-facing text must come from i18n keys, never from JSX literals.
    files: ["app/**/*.tsx", "src/**/*.tsx"],
    ignores: ["**/*.test.tsx", "src/features/settings/DevMenuScreen.tsx"],
    rules: {
      "react/jsx-no-literals": ["error", { noStrings: false, ignoreProps: true, allowedStrings: ["•", "/", "·", " "] }],
      "no-console": "error",
    },
  },
]);
