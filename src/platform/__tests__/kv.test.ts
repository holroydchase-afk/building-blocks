// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-2 (docs/product/SPEC-PLATFORM-LAYER.md). Written first (red) by qa-tdd, 2026-11-26.
// Contract, src/platform/kv.ts:
//   export interface KV { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void>; removeItem(k: string): Promise<void> }
//   export function memoryKV(seed?: Record<string, string>): KV & { dump(): Record<string, string> }
import { memoryKV } from '../kv';

describe('PL-2 memoryKV', () => {
  it('PL-2 get returns null for a missing key, set then get round-trips, remove deletes', async () => {
    const kv = memoryKV();
    expect(await kv.getItem('a')).toBeNull();
    await kv.setItem('a', '1');
    expect(await kv.getItem('a')).toBe('1');
    await kv.removeItem('a');
    expect(await kv.getItem('a')).toBeNull();
  });

  it('PL-2 seed is readable and dump() returns a plain snapshot of every entry', async () => {
    const kv = memoryKV({ x: 'y' });
    await kv.setItem('z', '2');
    expect(kv.dump()).toEqual({ x: 'y', z: '2' });
  });

  it('PL-2 dump() is a copy: mutating it does not change the store, and a new memoryKV(dump) simulates an app kill', async () => {
    const kv = memoryKV({ a: '1' });
    const snap = kv.dump();
    snap.a = 'changed';
    expect(await kv.getItem('a')).toBe('1');
    const reborn = memoryKV(kv.dump());
    expect(await reborn.getItem('a')).toBe('1');
  });

  it('PL-2 the seed object is not mutated by later writes; empty string is a value, not missing', async () => {
    const seed = { a: '1' };
    const kv = memoryKV(seed);
    await kv.setItem('b', '');
    expect(seed).toEqual({ a: '1' });
    expect(await kv.getItem('b')).toBe('');
  });

  it('PL-2 removing a missing key does not throw', async () => {
    await expect(memoryKV().removeItem('nope')).resolves.toBeUndefined();
  });
});
