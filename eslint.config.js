const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');
const prettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    files: ['apps/app/**/*.{ts,tsx}'],
    settings: {
      'import/resolver': {
        typescript: {
          project: './apps/app/tsconfig.json',
        },
      },
    },
  },
  {
    ignores: [
      'docsplan/**',
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'pnpm-lock.yaml',
      'apps/app/assets/**',
      'packages/content/corpus/**',
      'packages/content/sources/plac-cfrn-1999.txt',
      'e2e/**',
      'playwright.config.ts',
      'test-results/**',
      'playwright-report/**',
    ],
  },
]);
