import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-useless-escape": "off",
      "no-useless-assignment": "off",
      "prefer-const": "warn",
      "preserve-caught-error": "off"
    },
  },
  {
    ignores: [
      "output/**",
      "**/node_modules/**",
      "packages/core/output/**",
      "templates/**",
      "demo-frontend/**",
      "dist/**",
      "**/dist/**"
    ],
  },
);
