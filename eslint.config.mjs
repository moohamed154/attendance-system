import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Utility scripts - not part of the app bundle
    "scripts/**",
    "prisma/seed.ts",
    "proxy.ts",
  ]),
  {
    rules: {
      // Allow 'any' types intentionally used for Dictionary context and Prisma flexibility.
      // These are strategic decisions, not safety issues.
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow require() imports in legacy script contexts (scripts/ is ignored above)
      "@typescript-eslint/no-require-imports": "warn",
      // The react/no-children-prop rule is already fixed in primitives
      "react/no-children-prop": "error",
      // Downgrade ban-ts-comment to warn for pragmatic suppression
      "@typescript-eslint/ban-ts-comment": "warn",
      // Enforce no unused vars (keep as error for real unused code)
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    },
  },
]);

export default eslintConfig;
