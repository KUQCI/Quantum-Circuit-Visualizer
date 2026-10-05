import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts"] },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { ignoreRestSiblings: true, argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["scripts/sw.template.js"],
    languageOptions: {
      globals: {
        self: "readonly",
        caches: "readonly",
        clients: "readonly",
        fetch: "readonly",
        Response: "readonly",
        URL: "readonly",
        console: "readonly",
        Promise: "readonly",
        Set: "readonly",
        __QCV_BASE__: "readonly",
        __QCV_VERSION__: "readonly",
        __QCV_PRECACHE__: "readonly",
      },
    },
  },
];

export default config;
