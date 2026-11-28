// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-10 (docs/product/SPEC-APP-KIT-STATE.md): the public app-kit entry exports the new state pieces. (The no-product-words
// and SPDX header scans over src/ already live in tests/contract.test.ts and tests/platform-contract.test.ts.)
import * as kit from '../index';

describe('CL-40 app-kit entry exports the state pieces', () => {
  it('CL-40 createLastSeen, createPrefs, pickBoolean, pickOneOf, chooseRuntime and chainClears are exported', () => {
    const exported = kit as Record<string, unknown>;
    for (const n of ['createLastSeen', 'createPrefs', 'pickBoolean', 'pickOneOf', 'chooseRuntime', 'chainClears']) expect(typeof exported[n]).toBe('function');
  });
});
