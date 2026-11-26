// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
const base = require('jest-expo/jest-preset');
module.exports = {
  preset: 'jest-expo',
  // @noble/ciphers ships ESM only; transform it like the other packages.
  transformIgnorePatterns: [base.transformIgnorePatterns[0].replace('standard-navigation))', 'standard-navigation|@noble))'), ...base.transformIgnorePatterns.slice(1)],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}', '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
};
