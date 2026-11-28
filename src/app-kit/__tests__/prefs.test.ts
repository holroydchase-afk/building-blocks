// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-32 (docs/product/SPEC-APP-KIT-STATE.md). Written first (red) by qa-tdd, 2026-11-28.
// Contract, src/app-kit/prefs.ts:
//   createPrefs<T extends object, C = void>({ kv, key: (scope?: string) => string, defaults: (ctx: C) => T,
//     sanitize: (raw: unknown, defaults: T, ctx: C) => T }) -> { load(scope?, ctx?): Promise<T>; save(value: T, scope?): Promise<void> }
//   load gives defaults on missing, bad JSON, non-object JSON, a store that throws, or a sanitize that throws; sanitize only
//   sees a parsed object. save writes only JSON.stringify(value) and never throws.
//   pickBoolean(raw: unknown, fallback: boolean): boolean; pickOneOf<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T
import { memoryKV, type KV } from '../../platform';
import { createPrefs, pickBoolean, pickOneOf } from '../prefs';

type Mode = 'light' | 'dark' | 'system';
const MODES: readonly Mode[] = ['light', 'dark', 'system'];
interface P { easy: boolean; mode: Mode }

const make = (kv: KV, extra: { sanitize?: (raw: unknown, d: P, ctx: boolean) => P } = {}) =>
  createPrefs<P, boolean>({
    kv,
    key: (scope) => `app.prefs.v1.${scope ?? 'device'}`,
    defaults: (viewer) => ({ easy: viewer, mode: 'system' }),
    sanitize: extra.sanitize ?? ((raw, d) => {
      const r = raw as Record<string, unknown>;
      return { easy: pickBoolean(r.easy, d.easy), mode: pickOneOf(r.mode, MODES, d.mode) };
    }),
  });

const throwingKv = (sync: boolean): KV => {
  const boom = (): never => { throw new Error('disk'); };
  return sync
    ? { getItem: boom as never, setItem: boom as never, removeItem: boom as never }
    : { getItem: async () => boom(), setItem: async () => boom(), removeItem: async () => boom() };
};

describe('CL-32 createPrefs: choices kept on this device', () => {
  it('CL-32 nothing saved: the defaults, built from the context given to load', async () => {
    const p = make(memoryKV());
    expect(await p.load('u', true)).toEqual({ easy: true, mode: 'system' });
    expect(await p.load('u', false)).toEqual({ easy: false, mode: 'system' });
  });

  it('CL-32 save then load round-trips under key(scope); key sees undefined when no scope is given', async () => {
    const kv = memoryKV();
    const p = make(kv);
    await p.save({ easy: true, mode: 'dark' }, 'u-1');
    await p.save({ easy: false, mode: 'light' });
    expect(kv.dump()).toEqual({ 'app.prefs.v1.u-1': '{"easy":true,"mode":"dark"}', 'app.prefs.v1.device': '{"easy":false,"mode":"light"}' });
    expect(await p.load('u-1', false)).toEqual({ easy: true, mode: 'dark' });
    expect(await p.load(undefined, true)).toEqual({ easy: false, mode: 'light' });
    expect(await p.load('u-2', false)).toEqual({ easy: false, mode: 'system' });
  });

  it('CL-32 the context reaches defaults and sanitize', async () => {
    const seen: unknown[] = [];
    const p = make(memoryKV({ 'app.prefs.v1.u': '{"easy":true}' }), { sanitize: (raw, d, ctx) => { seen.push(ctx); return d; } });
    await p.load('u', true);
    expect(seen).toEqual([true]);
  });

  it('CL-32 bad JSON, empty text and a store that throws or rejects all give the defaults', async () => {
    for (const raw of ['{not json', '', '{"easy":', '\u0000']) {
      expect(await make(memoryKV({ 'app.prefs.v1.u': raw })).load('u', true)).toEqual({ easy: true, mode: 'system' });
    }
    for (const sync of [false, true]) expect(await make(throwingKv(sync)).load('u', true)).toEqual({ easy: true, mode: 'system' });
  });

  it('CL-32 JSON that is not an object (null, array, number, string, boolean) never reaches sanitize', async () => {
    const calls: unknown[] = [];
    for (const raw of ['null', '[1,2]', '[]', '5', '"text"', 'true', 'false', '0']) {
      const p = make(memoryKV({ 'app.prefs.v1.u': raw }), { sanitize: (r, d) => { calls.push(r); return d; } });
      expect(await p.load('u', true)).toEqual({ easy: true, mode: 'system' });
    }
    expect(calls).toEqual([]);
  });

  it('CL-32 sanitize sees the parsed object and the defaults, and what it returns is what load returns', async () => {
    let got: { raw?: unknown; d?: P } = {};
    const p = make(memoryKV({ 'app.prefs.v1.u': '{"easy":true,"extra":1}' }), { sanitize: (raw, d) => { got = { raw, d }; return { easy: false, mode: 'dark' }; } });
    expect(await p.load('u', false)).toEqual({ easy: false, mode: 'dark' });
    expect(got.raw).toEqual({ easy: true, extra: 1 });
    expect(got.d).toEqual({ easy: false, mode: 'system' });
  });

  it('CL-32 a sanitize that throws gives the defaults, not a crash', async () => {
    const p = make(memoryKV({ 'app.prefs.v1.u': '{"easy":true}' }), { sanitize: () => { throw new Error('bad shape'); } });
    expect(await p.load('u', true)).toEqual({ easy: true, mode: 'system' });
  });

  it('CL-32 wrong types and unknown choices fall back field by field (sanitize with the helpers)', async () => {
    const p = make(memoryKV({ 'app.prefs.v1.u': '{"easy":"yes","mode":"neon"}' }));
    expect(await p.load('u', true)).toEqual({ easy: true, mode: 'system' });
    const q = make(memoryKV({ 'app.prefs.v1.u': '{"easy":false,"mode":"dark"}' }));
    expect(await q.load('u', true)).toEqual({ easy: false, mode: 'dark' });
  });

  it('CL-32 hostile: __proto__ and constructor keys in stored JSON do not pollute Object.prototype or the defaults', async () => {
    const raw = '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted2":true}},"easy":false}';
    const p = createPrefs<P, boolean>({
      kv: memoryKV({ 'k': raw }), key: () => 'k', defaults: (v) => ({ easy: v, mode: 'system' }),
      sanitize: (_r, d) => d, // a sanitizer that ignores the stored text entirely
    });
    const out = await p.load(undefined, true);
    expect(out).toEqual({ easy: true, mode: 'system' });
    expect((out as unknown as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted2).toBeUndefined();
    // and with the normal helper-based sanitizer the stored easy value is still honoured
    const q = make(memoryKV({ 'app.prefs.v1.device': raw }));
    const o2 = await q.load(undefined, true);
    expect(o2).toEqual({ easy: false, mode: 'system' });
    expect(Object.keys(o2).sort()).toEqual(['easy', 'mode']);
  });

  it('CL-32 each load builds fresh defaults: changing one result never changes the next', async () => {
    const p = make(memoryKV());
    const a = await p.load('u', true);
    a.easy = false;
    expect(await p.load('u', true)).toEqual({ easy: true, mode: 'system' });
  });

  it('CL-32 a huge stored string is read without trouble and still sanitized', async () => {
    const big = JSON.stringify({ easy: true, junk: 'z'.repeat(3_000_000) });
    const p = make(memoryKV({ 'app.prefs.v1.u': big }));
    expect(await p.load('u', false)).toEqual({ easy: true, mode: 'system' });
  });

  it('CL-32 save writes only what JSON.stringify gives: undefined fields dropped, nothing else added', async () => {
    const kv = memoryKV();
    const p = createPrefs<{ a?: number; b: string }>({ kv, key: () => 'k', defaults: () => ({ b: '' }), sanitize: (_r, d) => d });
    await p.save({ a: undefined, b: 'x' });
    expect(kv.dump()).toEqual({ k: '{"b":"x"}' });
  });

  it('CL-32 save never throws: a store that throws or rejects, a circular value, a BigInt', async () => {
    for (const sync of [false, true]) await expect(make(throwingKv(sync)).save({ easy: true, mode: 'dark' }, 'u')).resolves.toBeUndefined();
    const kv = memoryKV();
    const loose = createPrefs<Record<string, unknown>>({ kv, key: () => 'k', defaults: () => ({}), sanitize: (_r, d) => d });
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    await expect(loose.save(circular)).resolves.toBeUndefined();
    await expect(loose.save({ n: BigInt(1) })).resolves.toBeUndefined();
    expect(kv.dump()).toEqual({}); // nothing half written
  });

  it('CL-32 a frozen value is saved and a proxy store that throws on every access is survived', async () => {
    const kv = memoryKV();
    await make(kv).save(Object.freeze({ easy: true, mode: 'dark' }) as P, 'u');
    expect(kv.dump()).toEqual({ 'app.prefs.v1.u': '{"easy":true,"mode":"dark"}' });
    const proxy = new Proxy({}, { get: () => { throw new Error('revoked'); } }) as unknown as KV;
    const p = make(proxy);
    expect(await p.load('u', true)).toEqual({ easy: true, mode: 'system' });
    await expect(p.save({ easy: true, mode: 'dark' }, 'u')).resolves.toBeUndefined();
  });
});

describe('CL-33 pickBoolean and pickOneOf', () => {
  it('CL-33 pickBoolean keeps real booleans and falls back for everything else', () => {
    expect(pickBoolean(true, false)).toBe(true);
    expect(pickBoolean(false, true)).toBe(false);
    for (const bad of ['true', 'false', 1, 0, null, undefined, NaN, {}, [], [true]]) {
      expect(pickBoolean(bad, true)).toBe(true);
      expect(pickBoolean(bad, false)).toBe(false);
    }
  });

  it('CL-33 pickOneOf keeps an allowed choice and falls back for anything else', () => {
    expect(pickOneOf('dark', MODES, 'system')).toBe('dark');
    expect(pickOneOf('system', MODES, 'light')).toBe('system');
    for (const bad of ['neon', '', 'DARK', ' dark', 3, null, undefined, {}, ['dark'], true]) expect(pickOneOf(bad, MODES, 'system')).toBe('system');
  });

  it('CL-33 hostile: inherited names and objects that print as an allowed value are not choices', () => {
    for (const bad of ['__proto__', 'toString', 'constructor', 'hasOwnProperty', 'length', '0']) expect(pickOneOf(bad, MODES, 'light')).toBe('light');
    expect(pickOneOf({ toString: () => 'dark' }, MODES, 'light')).toBe('light');
    expect(pickOneOf(Object('dark'), MODES, 'light')).toBe('light');
  });

  it('CL-33 an empty allowed list always gives the fallback', () => {
    expect(pickOneOf('dark', [] as readonly Mode[], 'system')).toBe('system');
  });
});
