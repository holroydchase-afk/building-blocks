// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-3, PL-4 (docs/product/SPEC-PLATFORM-LAYER.md). Written first (red) by qa-tdd, 2026-11-26.
// Contract:
//   src/platform/webStorage.ts: webStorage(): Storage | undefined   (undefined when localStorage throws or is absent)
//                               webKV(): KV   (localStorage-backed; memory fallback when storage is blocked or full)
//   src/platform/storage.ts:     asyncStorageKV: KV  (wraps @react-native-async-storage/async-storage; same keys)
//   src/platform/storage.web.ts: asyncStorageKV: KV  (= webKV(), same localStorage keys)
import { webKV, webStorage } from '../webStorage';

const real = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const restore = () => { if (real) Object.defineProperty(globalThis, 'localStorage', real); else delete (globalThis as { localStorage?: unknown }).localStorage; };
const fakeStorage = (over: Partial<Storage> = {}) => {
  const m = new Map<string, string>();
  const ls = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), length: 0, ...over };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: ls });
  return m;
};
afterEach(() => { restore(); jest.resetModules(); jest.dontMock('@react-native-async-storage/async-storage'); });

describe('PL-3 storage KV', () => {
  it('PL-3 webKV uses localStorage with the same keys', async () => {
    const m = fakeStorage();
    await webKV().setItem('app.x', 'y');
    expect(m.get('app.x')).toBe('y');
    expect(await webKV().getItem('app.x')).toBe('y');
    await webKV().removeItem('app.x');
    expect(m.has('app.x')).toBe(false);
  });

  it('PL-3 the phone asyncStorageKV wraps AsyncStorage (get, set, remove)', async () => {
    jest.doMock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
    const { asyncStorageKV } = require('../storage') as typeof import('../storage');
    const mod = require('@react-native-async-storage/async-storage') as { default?: { getItem(k: string): Promise<string | null> }; getItem?(k: string): Promise<string | null> };
    const AS = (mod.default ?? mod) as { getItem(k: string): Promise<string | null> };
    await asyncStorageKV.setItem('k', 'v');
    expect(await AS.getItem('k')).toBe('v');
    expect(await asyncStorageKV.getItem('k')).toBe('v');
    await asyncStorageKV.removeItem('k');
    expect(await asyncStorageKV.getItem('k')).toBeNull();
  });

  it('PL-3 the web twin storage.web.ts exports asyncStorageKV backed by localStorage with the same keys', async () => {
    const m = fakeStorage();
    const { asyncStorageKV } = require('../storage.web') as typeof import('../storage.web');
    await asyncStorageKV.setItem('k', 'v');
    expect(m.get('k')).toBe('v');
    expect(await asyncStorageKV.getItem('k')).toBe('v');
  });
});

describe('PL-4 blocked storage', () => {
  it('PL-4 a throwing localStorage getter gives undefined from webStorage(), and webKV keeps values in memory', async () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('SecurityError'); } });
    expect(webStorage()).toBeUndefined();
    const kv = webKV();
    await kv.setItem('a', '1');
    expect(await kv.getItem('a')).toBe('1');
    await kv.removeItem('a');
    expect(await kv.getItem('a')).toBeNull();
  });

  it('PL-4 a throwing setItem (quota or blocked) does not throw and the value is still readable this visit', async () => {
    fakeStorage({ setItem: () => { throw new Error('QuotaExceededError'); } });
    const kv = webKV();
    await expect(kv.setItem('a', '1')).resolves.toBeUndefined();
    expect(await kv.getItem('a')).toBe('1');
  });

  it('PL-4 throwing getItem and removeItem do not throw', async () => {
    fakeStorage({ getItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } });
    const kv = webKV();
    await kv.setItem('a', '1');
    expect(await kv.getItem('a')).toBe('1');
    await expect(kv.removeItem('a')).resolves.toBeUndefined();
    expect(await kv.getItem('a')).toBeNull();
  });

  it('PL-4 localStorage absent entirely (undefined) behaves like blocked', async () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: undefined });
    expect(webStorage()).toBeUndefined();
    const kv = webKV();
    await kv.setItem('a', '1');
    expect(await kv.getItem('a')).toBe('1');
  });

  it('PL-4 a key removed from storage is not resurrected from the memory copy', async () => {
    const m = fakeStorage();
    const kv = webKV();
    await kv.setItem('a', '1');
    await kv.removeItem('a');
    expect(m.has('a')).toBe(false);
    expect(await kv.getItem('a')).toBeNull();
  });
});
