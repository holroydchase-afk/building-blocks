// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-31 (docs/product/SPEC-APP-KIT-STATE.md). Written first (red) by qa-tdd, 2026-11-28. Seeded from a product's own
// last-visit tests. Contract, src/app-kit/lastSeen.ts:
//   export function createLastSeen(o: { kv: KV; keyPrefix: string }): { load(userId: string): Promise<string | null>; save(userId: string, iso: string): Promise<void> }
//   key is `${keyPrefix}.${userId}`; load gives null when empty, damaged, not a date or the store throws; save never throws.
import { memoryKV, type KV } from '../../platform';
import { createLastSeen } from '../lastSeen';

const throwing = (sync: boolean): KV => {
  const boom = (): never => { throw new Error('disk'); };
  return sync
    ? { getItem: boom as never, setItem: boom as never, removeItem: boom as never }
    : { getItem: async () => boom(), setItem: async () => boom(), removeItem: async () => boom() };
};

describe('CL-31 createLastSeen: the last visit kept on this device', () => {
  it('CL-31 first ever open: no last visit', async () => {
    expect(await createLastSeen({ kv: memoryKV(), keyPrefix: 'app.lastSeen.v1' }).load('u-1')).toBeNull();
  });

  it('CL-31 saved per person under <keyPrefix>.<userId>, read back as the exact string, others untouched', async () => {
    const kv = memoryKV({ 'app.prefs.v1.u-1': '{"a":1}' });
    const ls = createLastSeen({ kv, keyPrefix: 'app.lastSeen.v1' });
    await ls.save('u-1', '2026-11-11T14:00:00.000Z');
    expect(kv.dump()).toEqual({ 'app.prefs.v1.u-1': '{"a":1}', 'app.lastSeen.v1.u-1': '2026-11-11T14:00:00.000Z' });
    expect(await ls.load('u-1')).toBe('2026-11-11T14:00:00.000Z');
    expect(await ls.load('u-2')).toBeNull(); // another person on the same device starts fresh
  });

  it('CL-31 two prefixes on one store never see each other', async () => {
    const kv = memoryKV();
    const a = createLastSeen({ kv, keyPrefix: 'a' });
    const b = createLastSeen({ kv, keyPrefix: 'b' });
    await a.save('u', '2026-01-01T00:00:00.000Z');
    expect(await b.load('u')).toBeNull();
  });

  it('CL-31 a damaged, empty, whitespace or huge non-date value reads as no last visit', async () => {
    for (const bad of ['not a time', '', '   ', 'x'.repeat(2_000_000), 'null', '{"a":1}']) {
      const ls = createLastSeen({ kv: memoryKV({ 'p.u': bad }), keyPrefix: 'p' });
      expect(await ls.load('u')).toBeNull();
    }
  });

  it('CL-31 boundary: the epoch itself is a real date and is returned', async () => {
    const ls = createLastSeen({ kv: memoryKV({ 'p.u': '1970-01-01T00:00:00.000Z' }), keyPrefix: 'p' });
    expect(await ls.load('u')).toBe('1970-01-01T00:00:00.000Z');
  });

  it('CL-31 a store that rejects or throws at once reads as no last visit, and save never throws', async () => {
    for (const sync of [false, true]) {
      const ls = createLastSeen({ kv: throwing(sync), keyPrefix: 'p' });
      expect(await ls.load('u')).toBeNull();
      await expect(ls.save('u', '2026-01-01T00:00:00.000Z')).resolves.toBeUndefined();
    }
  });

  it('CL-31 a frozen or proxy store that throws on every access is survived', async () => {
    const proxy = new Proxy({}, { get: () => { throw new Error('revoked'); } }) as unknown as KV;
    const frozen = Object.freeze({ getItem: async () => 'junk', setItem: async () => { throw new TypeError('frozen'); }, removeItem: async () => {} }) as KV;
    for (const kv of [proxy, frozen]) {
      const ls = createLastSeen({ kv, keyPrefix: 'p' });
      expect(await ls.load('u')).toBeNull();
      await expect(ls.save('u', '2026-01-01T00:00:00.000Z')).resolves.toBeUndefined();
    }
  });

  it('CL-31 odd ids: empty, dotted and __proto__ ids are plain keys and do not collide', async () => {
    const kv = memoryKV();
    const ls = createLastSeen({ kv, keyPrefix: 'p' });
    await ls.save('', '2026-01-01T00:00:00.000Z');
    await ls.save('a.b', '2026-02-01T00:00:00.000Z');
    await ls.save('__proto__', '2026-03-01T00:00:00.000Z');
    expect(kv.dump()).toEqual({ 'p.': '2026-01-01T00:00:00.000Z', 'p.a.b': '2026-02-01T00:00:00.000Z', 'p.__proto__': '2026-03-01T00:00:00.000Z' });
    expect(await ls.load('a.b')).toBe('2026-02-01T00:00:00.000Z');
    expect(await ls.load('__proto__')).toBe('2026-03-01T00:00:00.000Z');
  });

  it('CL-31 a later save replaces the earlier one', async () => {
    const ls = createLastSeen({ kv: memoryKV(), keyPrefix: 'p' });
    await ls.save('u', '2026-01-01T00:00:00.000Z');
    await ls.save('u', '2026-06-01T00:00:00.000Z');
    expect(await ls.load('u')).toBe('2026-06-01T00:00:00.000Z');
  });
});
