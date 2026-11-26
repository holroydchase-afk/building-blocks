// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-5, PL-6, PL-7 (docs/product/SPEC-PLATFORM-LAYER.md). Written first (red) by qa-tdd, 2026-11-26.
// Contract, src/platform/secureSession.ts:
//   export interface KeyStore { get(name: string): Promise<string | null>; set(name: string, valueBase64: string): Promise<void>; delete(name: string): Promise<void> }
//     (values are base64 strings of the 32-byte AES-256 key)
//   export function createSecureSessionStorage(opts: { kv: KV; keys: KeyStore; prefix?: string }): KV
//     prefix defaults to 'bb_'. The blob lives in kv under `${prefix}s_${key}` as base64(nonce(12) | ciphertext | tag(16)), AES-256-GCM.
//     The key lives in keys under `${prefix}k_${safe(key)}` where safe replaces anything outside [A-Za-z0-9._-] with '_'.
//     getItem returns null for a missing blob, a missing key or a tampered blob (never throws). setItem creates the key
//     on first use and re-uses it, with a fresh 12-byte nonce each time. removeItem deletes both blob and key.
//   export const secureSessionStorage: KV   (default: AsyncStorage for the blob, expo-secure-store for the key, prefix 'bb_')
//   src/platform/secureSession.web.ts: export const secureSessionStorage: KV  (web twin: webKV(); no key store)
import { fromBase64 } from '../base64';
import { memoryKV } from '../kv';
import { createSecureSessionStorage, type KeyStore } from '../secureSession';

function fakeKeys() {
  const m = new Map<string, string>();
  const calls = { set: 0, delete: 0 };
  const keys: KeyStore = {
    get: async (k) => m.get(k) ?? null,
    set: async (k, v) => { calls.set++; m.set(k, v); },
    delete: async (k) => { calls.delete++; m.delete(k); },
  };
  return { keys, m, calls };
}
const make = (prefix?: string) => {
  const kv = memoryKV();
  const k = fakeKeys();
  return { kv, ...k, store: createSecureSessionStorage({ kv, keys: k.keys, ...(prefix ? { prefix } : {}) }) };
};
const SECRET = '{"access_token":"super-secret-value","n":1}';

describe('PL-5 secure session storage', () => {
  it('PL-5 set then get round-trips, including unicode and a value past 2 KB', async () => {
    const { store } = make();
    await store.setItem('s', SECRET);
    expect(await store.getItem('s')).toBe(SECRET);
    const big = 'é☃'.repeat(3000);
    await store.setItem('big', big);
    expect(await store.getItem('big')).toBe(big);
  });

  it('PL-5 the stored blob is not the plaintext and is nonce(12)+ciphertext+tag(16) long', async () => {
    const { kv, store } = make();
    await store.setItem('s', SECRET);
    const blobs = Object.values(kv.dump());
    expect(blobs).toHaveLength(1);
    expect(blobs[0]).not.toContain('super-secret-value');
    expect(fromBase64(blobs[0]!)).toHaveLength(12 + new TextEncoder().encode(SECRET).length + 16);
  });

  it('PL-5 only a 32-byte key lives in the key store, as base64; the kv holds no key', async () => {
    const { kv, m, store } = make();
    await store.setItem('s', SECRET);
    expect(m.size).toBe(1);
    expect(fromBase64([...m.values()][0]!)).toHaveLength(32);
    expect(Object.values(kv.dump()).join('')).not.toContain([...m.values()][0]!);
  });

  it('PL-5 a missing key returns null (never throws)', async () => {
    const { m, store } = make();
    await store.setItem('s', SECRET);
    m.clear();
    expect(await store.getItem('s')).toBeNull();
  });

  it('PL-5 a missing blob returns null; an unknown item returns null', async () => {
    const { kv, store } = make();
    await store.setItem('s', SECRET);
    await kv.removeItem(Object.keys(kv.dump())[0]!);
    expect(await store.getItem('s')).toBeNull();
    expect(await store.getItem('never-set')).toBeNull();
  });

  it.each([['flipped ciphertext byte'], ['truncated'], ['garbage non-base64'], ['empty string']])('PL-5 a tampered blob (%s) returns null, not an exception', async (kind) => {
    const { kv, store } = make();
    await store.setItem('s', SECRET);
    const [name, blob] = Object.entries(kv.dump())[0]!;
    const raw = fromBase64(blob);
    const { toBase64 } = require('../base64') as typeof import('../base64');
    const bad = kind === 'flipped ciphertext byte' ? toBase64(Uint8Array.from(raw, (b, i) => (i === 20 ? b ^ 1 : b)))
      : kind === 'truncated' ? toBase64(raw.subarray(0, 10)) : kind === 'garbage non-base64' ? '!!!not base64!!!' : '';
    await kv.setItem(name, bad);
    expect(await store.getItem('s')).toBeNull();
  });

  it('PL-5 a blob moved under another item name does not decrypt (different key)', async () => {
    const { kv, store } = make();
    await store.setItem('a', 'AAA');
    await store.setItem('b', 'BBB');
    const d = kv.dump();
    const [an, bn] = [Object.keys(d).find((k) => k.endsWith('a'))!, Object.keys(d).find((k) => k.endsWith('b'))!];
    await kv.setItem(bn, d[an]!);
    expect(await store.getItem('b')).toBeNull();
  });

  it('PL-5 removeItem deletes both the blob and the key; removing an unknown item does not throw', async () => {
    const { kv, m, store } = make();
    await store.setItem('s', SECRET);
    await store.removeItem('s');
    expect(kv.dump()).toEqual({});
    expect(m.size).toBe(0);
    expect(await store.getItem('s')).toBeNull();
    await expect(store.removeItem('nope')).resolves.toBeUndefined();
  });

  it('PL-5 key names given to the key store are sanitised (only [A-Za-z0-9._-]), even for hostile item names', async () => {
    const { m, store } = make();
    await store.setItem('sb:session/token with spaces?é', SECRET);
    expect(await store.getItem('sb:session/token with spaces?é')).toBe(SECRET);
    for (const name of m.keys()) expect(name).toMatch(/^[A-Za-z0-9._-]+$/);
  });
});

describe('PL-6 isolation and nonce reuse', () => {
  it('PL-6 two items never share a key or a blob, and one cannot read the other after the other is removed', async () => {
    const { kv, m, store } = make();
    await store.setItem('a', 'same plaintext');
    await store.setItem('b', 'same plaintext');
    expect(new Set(m.values()).size).toBe(2);
    expect(new Set(Object.values(kv.dump())).size).toBe(2);
    await store.removeItem('a');
    expect(await store.getItem('b')).toBe('same plaintext');
  });

  it('PL-6 a second set re-uses the existing key (one key written) with a fresh nonce, and the new value wins', async () => {
    const { kv, calls, store } = make();
    await store.setItem('s', 'one');
    const first = fromBase64(Object.values(kv.dump())[0]!);
    await store.setItem('s', 'one');
    const second = fromBase64(Object.values(kv.dump())[0]!);
    expect(calls.set).toBe(1);
    expect(Buffer.from(first.subarray(0, 12)).equals(Buffer.from(second.subarray(0, 12)))).toBe(false);
    await store.setItem('s', 'two');
    expect(await store.getItem('s')).toBe('two');
  });

  it('PL-6 a different store instance over the same kv and keys reads the data (survives an app kill)', async () => {
    const { kv, keys, store } = make();
    await store.setItem('s', SECRET);
    const reborn = createSecureSessionStorage({ kv: memoryKV(kv.dump()), keys });
    expect(await reborn.getItem('s')).toBe(SECRET);
  });
});

describe('PL-7 injectable and configurable', () => {
  it('PL-7 default prefix is bb_ for both blob and key names', async () => {
    const { kv, m, store } = make();
    await store.setItem('s', 'v');
    expect(Object.keys(kv.dump()).every((k) => k.startsWith('bb_'))).toBe(true);
    expect([...m.keys()].every((k) => k.startsWith('bb_'))).toBe(true);
  });

  it('PL-7 a custom prefix is used for both, and two prefixes over the same stores do not collide', async () => {
    const kv = memoryKV();
    const { keys, m } = fakeKeys();
    const a = createSecureSessionStorage({ kv, keys, prefix: 'one_' });
    const b = createSecureSessionStorage({ kv, keys, prefix: 'two_' });
    await a.setItem('s', 'A');
    await b.setItem('s', 'B');
    expect(Object.keys(kv.dump()).sort().map((k) => k.slice(0, 4))).toEqual(['one_', 'two_']);
    expect([...m.keys()].every((k) => k.startsWith('one_') || k.startsWith('two_'))).toBe(true);
    expect(await a.getItem('s')).toBe('A');
    expect(await b.getItem('s')).toBe('B');
  });

  it('PL-7 createSecureSessionStorage needs no native module: importing it does not load expo-secure-store or async-storage', () => {
    jest.resetModules();
    const loaded: string[] = [];
    jest.doMock('expo-secure-store', () => { loaded.push('expo-secure-store'); return {}; });
    jest.doMock('@react-native-async-storage/async-storage', () => { loaded.push('async-storage'); return {}; });
    const mod = require('../secureSession') as typeof import('../secureSession');
    expect(typeof mod.createSecureSessionStorage).toBe('function');
    // The default export is allowed to wire them lazily; the factory itself must not need them.
    createSecureSessionStorage({ kv: memoryKV(), keys: fakeKeys().keys });
    jest.dontMock('expo-secure-store');
    jest.dontMock('@react-native-async-storage/async-storage');
  });

  it('PL-7 the default secureSessionStorage wires AsyncStorage for the blob and expo-secure-store (bb_k_ names) for the key', async () => {
    jest.resetModules();
    const secure = new Map<string, string>();
    jest.doMock('expo-secure-store', () => ({
      getItemAsync: async (k: string) => secure.get(k) ?? null,
      setItemAsync: async (k: string, v: string) => void secure.set(k, v),
      deleteItemAsync: async (k: string) => void secure.delete(k),
    }));
    jest.doMock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
    const { secureSessionStorage } = require('../secureSession') as typeof import('../secureSession');
    const asMod = require('@react-native-async-storage/async-storage') as { default?: { getItem(k: string): Promise<string | null> }; getItem?(k: string): Promise<string | null> };
    const AS = (asMod.default ?? asMod) as { getItem(k: string): Promise<string | null> };
    await secureSessionStorage.setItem('s', SECRET);
    expect(await secureSessionStorage.getItem('s')).toBe(SECRET);
    expect([...secure.keys()]).toEqual(['bb_k_s']);
    expect(fromBase64(secure.get('bb_k_s')!)).toHaveLength(32);
    expect(await AS.getItem('bb_s_s')).not.toContain('super-secret-value');
    expect(await AS.getItem('bb_s_s')).not.toBeNull();
    await secureSessionStorage.removeItem('s');
    expect(secure.size).toBe(0);
    jest.dontMock('expo-secure-store');
    jest.dontMock('@react-native-async-storage/async-storage');
  });

  it('PL-7 the web twin secureSession.web.ts exports secureSessionStorage as a working KV with no native modules', async () => {
    jest.resetModules();
    const { secureSessionStorage } = require('../secureSession.web') as typeof import('../secureSession.web');
    await secureSessionStorage.setItem('s', 'v');
    expect(await secureSessionStorage.getItem('s')).toBe('v');
    await secureSessionStorage.removeItem('s');
    expect(await secureSessionStorage.getItem('s')).toBeNull();
  });
});
