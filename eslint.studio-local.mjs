// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Repo-local ESLint overrides (the managed eslint.config.mjs loads this last).
// The contract tests load the layer lazily with require() so one test can read the whole public API; allow that in tests only.
export default [
  { ignores: ['storybook-static/**'] }, // build output of build-storybook
  {
    files: ['**/__tests__/**', 'tests/**'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
