// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Cryptographically secure random bytes, from expo-crypto's getRandomValues only.
import * as ExpoCrypto from 'expo-crypto';

// Not getRandomBytes: it falls back to Math.random in dev builds without the old bridge hook (including Expo Go).
// One getRandomValues call fills at most 65536 bytes (the WebCrypto limit).
const CHUNK = 65536;

/** Secure random bytes (native on device, WebCrypto on web). Throws if no secure source exists; never uses Math.random. */
export function randomBytes(n: number): Uint8Array {
  const fill = (ExpoCrypto as { getRandomValues?: (a: Uint8Array) => unknown }).getRandomValues;
  if (typeof fill !== 'function') throw new Error('No secure random source on this device');
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i += CHUNK) fill(out.subarray(i, Math.min(n, i + CHUNK)));
  return out;
}
