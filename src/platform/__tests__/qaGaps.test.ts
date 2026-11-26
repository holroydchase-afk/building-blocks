// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Post-build gap tests by qa-tdd, 2026-11-26 (docs/product/SPEC-PLATFORM-LAYER.md). `it.failing` marks a known defect
// (QA-R id in the title): it passes while the bug exists and turns red when the engineer fixes it, so flip it to `it`.
import { toBase64 } from '../base64';
import { memoryKV } from '../kv';
import { createSecureSessionStorage, type KeyStore } from '../secureSession';
import { webKV } from '../webStorage';

const fakeKeys = () => {
  const m = new Map<string, string>();
  const keys: KeyStore = { get: async (k) => m.get(k) ?? null, set: async (k, v) => void m.set(k, v), delete: async (k) => void m.delete(k) };
  return { keys, m };
};

describe('QA-R1 secureSession key store damage', () => {
  it('QA-R1 a corrupt (wrong-length) key in the key store heals on the next setItem instead of throwing forever', async () => {
    const kv = memoryKV();
    const { keys, m } = fakeKeys();
    const store = createSecureSessionStorage({ kv, keys });
    await store.setItem('s', 'one');
    m.set([...m.keys()][0]!, toBase64(new Uint8Array(5)));
    expect(await store.getItem('s')).toBeNull();
    await store.setItem('s', 'two');
    expect(await store.getItem('s')).toBe('two');
  });

  it('QA-R2 two concurrent first writes of one item leave a readable value', async () => {
    const base = memoryKV();
    const { keys } = fakeKeys();
    let n = 0;
    // The first writer's blob lands last (a slow disk), after the second writer replaced the key.
    const kv = { ...base, setItem: async (k: string, v: string) => { if (n++ === 0) await new Promise((r) => setTimeout(r, 20)); await base.setItem(k, v); } };
    const store = createSecureSessionStorage({ kv, keys });
    await Promise.all([store.setItem('s', 'A'), store.setItem('s', 'B')]);
    expect(['A', 'B']).toContain(await store.getItem('s'));
  });

  it('a failing blob write does not corrupt an existing value', async () => {
    const kv = memoryKV();
    const { keys } = fakeKeys();
    const store = createSecureSessionStorage({ kv, keys });
    await store.setItem('s', 'good');
    const failing = createSecureSessionStorage({ kv: { ...kv, setItem: async () => { throw new Error('disk full'); } }, keys });
    await expect(failing.setItem('s', 'bad')).rejects.toThrow('disk full');
    expect(await store.getItem('s')).toBe('good');
  });

  it('empty-string values round-trip', async () => {
    const { keys } = fakeKeys();
    const store = createSecureSessionStorage({ kv: memoryKV(), keys });
    await store.setItem('s', '');
    expect(await store.getItem('s')).toBe('');
  });

  it('item names that sanitise to the same key name share a key but not a blob (documented collision)', async () => {
    const kv = memoryKV();
    const { keys, m } = fakeKeys();
    const store = createSecureSessionStorage({ kv, keys });
    await store.setItem('a b', 'one');
    await store.setItem('a_b', 'two');
    expect(m.size).toBe(1);
    expect(await store.getItem('a b')).toBe('one');
    expect(await store.getItem('a_b')).toBe('two');
  });
});

describe('QA-R3 webKV stale memory', () => {
  it('QA-R3 a value removed from localStorage by another tab is not resurrected from this tab\'s memory copy', async () => {
    const m = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), length: 0 } });
    try {
      const kv = webKV();
      await kv.setItem('a', '1');
      m.delete('a');
      expect(await kv.getItem('a')).toBeNull();
    } finally {
      delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });
});

describe('QA-R4 readBytes', () => {
  const fetchMock = jest.fn();
  beforeEach(() => { fetchMock.mockReset(); (globalThis as { fetch?: unknown }).fetch = fetchMock; });

  it('QA-R4 a non-ok http response (404/500) rejects instead of returning the error page as bytes', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, arrayBuffer: async () => new TextEncoder().encode('Not found').buffer });
    const { readBytes } = require('../bytes.web') as typeof import('../bytes.web');
    await expect(readBytes('https://example.test/missing')).rejects.toBeDefined();
  });
});

describe('platform entry on web', () => {
  it('importing the index loads neither async-storage nor expo-secure-store (lazy native requires)', () => {
    jest.resetModules();
    const loaded: string[] = [];
    jest.doMock('expo-secure-store', () => { loaded.push('secure'); return {}; });
    jest.doMock('@react-native-async-storage/async-storage', () => { loaded.push('async'); return {}; });
    const idx = require('../index') as typeof import('../index');
    expect(typeof idx.randomBytes).toBe('function');
    expect(loaded).toEqual([]);
    jest.dontMock('expo-secure-store');
    jest.dontMock('@react-native-async-storage/async-storage');
  });
});
