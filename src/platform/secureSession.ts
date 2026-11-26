// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Encrypted session storage. Sessions can exceed SecureStore's ~2 KB comfort limit, so the value is AES-256-GCM
// encrypted into a KV and only the 32-byte key lives in the Keychain / Keystore (the "large secure store" pattern).
import { gcm } from '@noble/ciphers/aes.js';
import { fromBase64, toBase64 } from './base64';
import type { KV } from './kv';
import { randomBytes } from './random';

/** Holds the 32-byte keys (as base64). On a phone this is expo-secure-store. */
export interface KeyStore {
  get(name: string): Promise<string | null>;
  set(name: string, valueBase64: string): Promise<void>;
  delete(name: string): Promise<void>;
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const safe = (k: string) => k.replace(/[^A-Za-z0-9._-]/g, '_');

export function createSecureSessionStorage(opts: { kv: KV; keys: KeyStore; prefix?: string }): KV {
  const { kv, keys } = opts;
  const prefix = opts.prefix ?? 'bb_';
  const blobName = (key: string) => `${prefix}s_${key}`;
  const keyName = (key: string) => `${prefix}k_${safe(key)}`;

  const decodeKey = (b64: string | null): Uint8Array | null => {
    if (!b64) return null;
    try {
      const k = fromBase64(b64);
      return k.length === 32 ? k : null;
    } catch {
      return null;
    }
  };
  // First-time key creation is serialised per item name so concurrent setItem calls share one key.
  const creating = new Map<string, Promise<Uint8Array>>();

  async function keyFor(key: string, create: boolean): Promise<Uint8Array | null> {
    const name = keyName(key);
    const existing = decodeKey(await keys.get(name));
    if (existing || !create) return existing;
    const pending = creating.get(name);
    if (pending) return pending;
    const p = (async () => {
      const again = decodeKey(await keys.get(name));
      if (again) return again;
      const fresh = randomBytes(32);
      await keys.set(name, toBase64(fresh));
      return fresh;
    })();
    creating.set(name, p);
    try {
      return await p;
    } finally {
      creating.delete(name);
    }
  }

  return {
    async getItem(key) {
      try {
        const blob = await kv.getItem(blobName(key));
        const k = await keyFor(key, false);
        if (!blob || !k) return null;
        const raw = fromBase64(blob);
        return dec.decode(gcm(k, raw.subarray(0, 12)).decrypt(raw.subarray(12)));
      } catch {
        return null;
      }
    },
    async setItem(key, value) {
      const k = (await keyFor(key, true))!;
      const nonce = randomBytes(12);
      const ct = gcm(k, nonce).encrypt(enc.encode(value));
      const out = new Uint8Array(12 + ct.length);
      out.set(nonce);
      out.set(ct, 12);
      await kv.setItem(blobName(key), toBase64(out));
    },
    async removeItem(key) {
      await kv.removeItem(blobName(key));
      await keys.delete(keyName(key));
    },
  };
}

type AsyncStore = Pick<typeof import('@react-native-async-storage/async-storage').default, 'getItem' | 'setItem' | 'removeItem'>;
// The native modules are loaded on first use, so importing the factory (or this file in a test) needs no native module.
const asyncStorage = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const m = require('@react-native-async-storage/async-storage') as { default?: AsyncStore } & AsyncStore;
  return m.default ?? m;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const secureStore = () => require('expo-secure-store') as typeof import('expo-secure-store');

/** Default: blob in AsyncStorage, key in expo-secure-store, prefix `bb_`. */
export const secureSessionStorage: KV = createSecureSessionStorage({
  kv: {
    getItem: (k) => asyncStorage().getItem(k),
    setItem: (k, v) => asyncStorage().setItem(k, v),
    removeItem: (k) => asyncStorage().removeItem(k),
  },
  keys: {
    get: (n) => secureStore().getItemAsync(n),
    set: (n, v) => secureStore().setItemAsync(n, v),
    delete: (n) => secureStore().deleteItemAsync(n),
  },
});
