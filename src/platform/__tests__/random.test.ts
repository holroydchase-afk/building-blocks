// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-11 (docs/product/SPEC-PLATFORM-LAYER.md). Written first (red) by qa-tdd, 2026-11-26.
// Contract, src/platform/random.ts:
//   randomBytes(n: number): Uint8Array   n bytes from expo-crypto's getRandomValues only (filled in chunks of at most 65536);
//   throws if getRandomValues is missing. Never uses getRandomBytes (Math.random fallback in dev builds) and never Math.random.
const zeros = (n: number) => new Uint8Array(n); // stands in for the predictable fallback

function withExpoCrypto(m: Record<string, unknown>) {
  jest.resetModules();
  jest.doMock('expo-crypto', () => ({ randomUUID: () => 'x', ...m }));
}
afterEach(() => jest.dontMock('expo-crypto'));
const nodeFill = (a: Uint8Array) => { a.set(require('crypto').randomBytes(a.length)); return a; };

describe('PL-11 randomBytes', () => {
  it('PL-11 returns n bytes from getRandomValues, never getRandomBytes, for any size (past 1024 and 65536)', () => {
    const fill = jest.fn(nodeFill);
    withExpoCrypto({ getRandomBytes: zeros, getRandomValues: fill });
    const { randomBytes } = require('../random') as typeof import('../random');
    const r = randomBytes(32);
    expect(r).toHaveLength(32);
    expect(r.some((b) => b !== 0)).toBe(true);
    expect(randomBytes(100_000)).toHaveLength(100_000);
    for (const call of fill.mock.calls) expect((call[0] as Uint8Array).length).toBeLessThanOrEqual(65536);
  });

  it('PL-11 every byte of a large request is filled (chunk edges)', () => {
    withExpoCrypto({ getRandomValues: (a: Uint8Array) => { a.fill(7); return a; } });
    const { randomBytes } = require('../random') as typeof import('../random');
    for (const n of [0, 1, 65535, 65536, 65537, 131072]) {
      const r = randomBytes(n);
      expect(r).toHaveLength(n);
      expect(r.every((b) => b === 7)).toBe(true);
    }
  });

  it('PL-11 throws when no secure source exists, and does not fall back to Math.random', () => {
    withExpoCrypto({ getRandomBytes: zeros });
    const rnd = jest.spyOn(Math, 'random');
    const { randomBytes } = require('../random') as typeof import('../random');
    expect(() => randomBytes(32)).toThrow();
    expect(rnd).not.toHaveBeenCalled();
    rnd.mockRestore();
  });

  it('PL-11 does not call Math.random even when a source exists', () => {
    withExpoCrypto({ getRandomValues: nodeFill });
    const rnd = jest.spyOn(Math, 'random');
    const { randomBytes } = require('../random') as typeof import('../random');
    randomBytes(64);
    expect(rnd).not.toHaveBeenCalled();
    rnd.mockRestore();
  });

  it('PL-11 two calls give different bytes (not a constant)', () => {
    withExpoCrypto({ getRandomValues: nodeFill });
    const { randomBytes } = require('../random') as typeof import('../random');
    expect(Buffer.from(randomBytes(32)).equals(Buffer.from(randomBytes(32)))).toBe(false);
  });
});
