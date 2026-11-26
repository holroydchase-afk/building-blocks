// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
/* global jest */
// Node-backed stand-in: expo-crypto's native getRandomValues is a no-op under Jest, which would make every key and nonce zeros.
jest.mock('expo-crypto', () => ({
  getRandomValues: (a) => { require('crypto').randomFillSync(a); return a; },
  randomUUID: () => require('crypto').randomUUID(),
}));
