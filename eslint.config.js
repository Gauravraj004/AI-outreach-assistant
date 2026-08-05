import eslint from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  eslint.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: { globals: { ...globals.browser, chrome: "readonly" } },
    rules: { "no-console": "error" },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["*.config.js", "scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
];
