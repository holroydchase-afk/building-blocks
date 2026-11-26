// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}', '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
};
