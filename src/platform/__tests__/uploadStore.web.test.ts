// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-23: the web upload byte store, generic. Files a person picked are prepared (cleaned) BEFORE the job is saved, sealed
// with the session key and kept in IndexedDB under `<stageId>/<index>`; the queue item's uri becomes `<scheme><stageId>/<index>`.
// Jest uses an injected Map fake for IndexedDB. Moved over from the app it was first built in, with its words turned into
// options (the kept test, the cleanliness check, the scheme). Written first (red) by qa-tdd, 2026-11-28.
import * as mod from '../uploadStore.web';
import { createSecureSessionStorage } from '../secureSession.web';

interface Prepared { spec: unknown; display: Uint8Array; thumb: Uint8Array }
interface QueueItem { uri: string; kind: 'image' | 'clip'; durationMs?: number }
class CodeError extends Error { constructor(public code: string) { super(code); } }
const DIRTY = new TextEncoder().encode('EXIF-GPS-SERIAL');
const hasBytes = (hay: Uint8Array, needle: Uint8Array) => Buffer.from(hay).indexOf(Buffer.from(needle)) !== -1;
/** The app's check: throws a coded error when the bytes carry the private marker. */
const verify = (b: Uint8Array) => { if (hasBytes(b, DIRTY)) throw new CodeError('META_EXIF'); };
const SCHEME = 'test-q:';
const imageData = (n: number, seed = 7) => Uint8Array.from({ length: n }, (_v, i) => (i * 31 + seed) % 251);
const jpeg = (...parts: Uint8Array[]) => Uint8Array.from(parts.flatMap((p) => [...p]));

type Rec = { v: number; spec: Uint8Array; display: Uint8Array; thumb: Uint8Array };
interface Db { get(k: string): Promise<Rec | undefined>; put(k: string, r: Rec): Promise<void>; delete(k: string): Promise<void>; keys(): Promise<string[]>; wipe(): Promise<void> }
interface Sealer { sealBytes(n: string, b: Uint8Array): Promise<Uint8Array | null>; openBytes(n: string, s: Uint8Array): Promise<Uint8Array | null> }
interface Store {
  stage(items: QueueItem[], prepare: (i: QueueItem) => Promise<Prepared>, onProgress?: (d: number, t: number) => void): Promise<{ items: QueueItem[]; durable: boolean }>;
  open(uri: string): Promise<Prepared | null>;
  has(uri: string): Promise<boolean>;
  release(uris: string[]): Promise<void>;
  sweep(live: string[]): Promise<void>;
  wipe(): Promise<void>;
}
type Opts = { db: Db; sealer: Sealer; report: (code: string) => void; capBytes?: number };
const opts = (o: Opts) => ({ ...o, keeps: (i: QueueItem) => i.kind === 'image', verify, scheme: SCHEME });
const create = (o: Opts): Store => {
  const f = (mod as unknown as { createUploadStore?: (o: unknown) => Store }).createUploadStore;
  if (typeof f !== 'function') throw new Error('platform/uploadStore.web.ts does not export createUploadStore');
  return f(opts(o));
};

/** The Map fake: what IndexedDB would hold, with a switch for "blocked" and "quota". */
function mapDb(opts: { putFails?: () => Error | null } = {}) {
  const m = new Map<string, Rec>();
  const db: Db & { m: Map<string, Rec>; wiped: number } = {
    m, wiped: 0,
    get: async (k) => m.get(k),
    put: async (k, r) => { const e = opts.putFails?.(); if (e) throw e; m.set(k, r); },
    delete: async (k) => { m.delete(k); },
    keys: async () => [...m.keys()],
    wipe: async () => { m.clear(); db.wiped += 1; },
  };
  return db;
}

/** A stand-in for secureSession.web's sealBytes/openBytes: XOR, name remembered. Records every name it was asked for. */
function xorSealer(opts: { nullSeal?: boolean } = {}) {
  const names: string[] = [];
  const tag = new WeakMap<Uint8Array, string>();
  const sealer: Sealer & { names: string[] } = {
    names,
    sealBytes: async (n, b) => {
      names.push(n);
      if (opts.nullSeal) return null;
      const out = new Uint8Array(b.length + 28).map((_, i) => (i < b.length ? b[i]! ^ 0x5a : 0x11));
      tag.set(out, n);
      return out;
    },
    openBytes: async (n, s) => (tag.get(s) === n ? s.subarray(0, s.length - 28).map((x) => x ^ 0x5a) : null),
  };
  return sealer;
}

const clean = (_w = 640, _h = 480, scan = 400) => jpeg(Uint8Array.from([0xff, 0xd8]), imageData(scan));
function prep(scan = 400): Prepared {
  const display = clean(2048, 1536, scan);
  const thumb = clean(320, 240, 64);
  return { spec: { kind: 'image', mime_type: 'image/jpeg', width: 2048, height: 1536, duration_ms: null, byte_size: display.length + 28, thumb_byte_size: thumb.length + 28, exif_stripped: true }, display, thumb };
}
const photo = (n: number): QueueItem => ({ uri: `blob:http://127.0.0.1/${n}`, kind: 'image' });
const has = hasBytes;

function setup(extra: Partial<Opts> = {}, dbOpts: Parameters<typeof mapDb>[0] = {}) {
  const db = mapDb(dbOpts);
  const sealer = xorSealer();
  const reports: string[] = [];
  const store = create({ db, sealer, report: (c) => { reports.push(c); }, ...extra });
  return { db, sealer, reports, store };
}

describe('PL-23 upload byte store: staging cleaned bytes (PL-23 29)', () => {
  it('PL-23 29 stage seals display, thumb and spec into one record per photo under <stageId>/<index>, and points each item at test-q:', async () => {
    const { db, store, sealer } = setup();
    const p = prep();
    const r = await store.stage([photo(1), photo(2)], async () => p);
    expect(r.durable).toBe(true);
    expect(r.items.map((i) => i.uri)).toEqual([expect.stringMatching(/^test-q:[^/]+\/0$/), expect.stringMatching(/^test-q:[^/]+\/1$/)]);
    expect(r.items.every((i) => i.kind === 'image')).toBe(true);
    const keys = [...db.m.keys()].sort();
    expect(keys).toEqual(r.items.map((i) => i.uri.replace('test-q:', '')).sort());
    for (const rec of db.m.values()) {
      expect(rec.v).toBe(1);
      for (const part of [rec.display, rec.thumb, rec.spec]) expect(part).toBeInstanceOf(Uint8Array); // no base64 strings
    }
    const stageId = r.items[0]!.uri.slice('test-q:'.length).split('/')[0]!;
    expect(sealer.names.sort()).toEqual([0, 1].flatMap((i) => ['display', 'spec', 'thumb'].map((k) => `q.${stageId}/${i}/${k}`)).sort());
  });

  it('PL-23 29 no plain bytes at rest: nothing of the cleaned display, thumb or spec JSON is readable in the stored record', async () => {
    const { db, store } = setup();
    const p = prep(900);
    await store.stage([photo(1)], async () => p);
    const rec = [...db.m.values()][0]!;
    expect(has(rec.display, p.display.subarray(60, 100))).toBe(false);
    expect(has(rec.thumb, p.thumb.subarray(20, 50))).toBe(false);
    expect(has(rec.spec, new TextEncoder().encode('image/jpeg'))).toBe(false);
  });

  it('PL-23 29 every stage gets a fresh id (two posts never share a key)', async () => {
    const { store } = setup();
    const a = await store.stage([photo(1)], async () => prep());
    const b = await store.stage([photo(2)], async () => prep());
    expect(a.items[0]!.uri).not.toBe(b.items[0]!.uri);
  });

  it('PL-23 29 open gives the cleaned bytes and spec back, and has() is true; an unknown uri is null/false', async () => {
    const { store } = setup();
    const p = prep();
    const r = await store.stage([photo(1)], async () => p);
    const uri = r.items[0]!.uri;
    const got = (await store.open(uri))!;
    expect(Buffer.from(got.display)).toEqual(Buffer.from(p.display));
    expect(Buffer.from(got.thumb)).toEqual(Buffer.from(p.thumb));
    expect(got.spec).toEqual(p.spec);
    expect(await store.has(uri)).toBe(true);
    expect(await store.has('test-q:nope/0')).toBe(false);
    expect(await store.open('test-q:nope/0')).toBeNull();
  });

  it('PL-23 29 stage reports "Getting photos ready… 1 of 3" progress, one call per photo', async () => {
    const { store } = setup();
    const seen: [number, number][] = [];
    await store.stage([photo(1), photo(2), photo(3)], async () => prep(), (d, t) => seen.push([d, t]));
    expect(seen).toEqual([[1, 3], [2, 3], [3, 3]]);
  });

  it('PL-23 29 a video item passes through untouched (Fake-build videos stay blob: and memory-only): not prepared, nothing stored', async () => {
    const { store, db } = setup();
    const prepare = jest.fn(async () => prep());
    const v: QueueItem = { uri: 'blob:http://127.0.0.1/v', kind: 'clip', durationMs: 9000 };
    const r = await store.stage([v], prepare);
    expect(r.items).toEqual([v]);
    expect(prepare).not.toHaveBeenCalled();
    expect(db.m.size).toBe(0);
  });

  it('PL-23 29 a prepare that fails halfway leaves nothing behind (no orphan record from the photos that did work)', async () => {
    const { store, db } = setup();
    let n = 0;
    await expect(store.stage([photo(1), photo(2), photo(3)], async () => { if (++n === 3) throw new TypeError('Failed to fetch'); return prep(); })).rejects.toBeDefined();
    expect(db.m.size).toBe(0);
  });
});

describe('PL-23 the original never lands on disk (PL-23 26, 29)', () => {
  it('PL-23 26 stage refuses a prepared photo that still carries Exif/GPS (verifyClean fails closed, META_ code) and stores nothing', async () => {
    const { store, db } = setup();
    const dirty = { ...prep(), display: jpeg(Uint8Array.from([0xff, 0xd8]), DIRTY, imageData(200)) };
    expect(hasBytes(dirty.display, DIRTY)).toBe(true); // the fixture really carries the private marker
    const err = await store.stage([photo(1)], async () => dirty).catch((e) => e);
    expect((err as CodeError).code).toMatch(/^META_/);
    expect(db.m.size).toBe(0);
  });

  it('PL-23 26 open re-runs verifyClean: a record whose bytes carry Exif (tampered, or written by an old build) opens as null', async () => {
    const { store, db, sealer } = setup();
    const r = await store.stage([photo(1)], async () => prep());
    const uri = r.items[0]!.uri;
    const key = uri.replace('test-q:', '');
    const dirtyDisplay = jpeg(Uint8Array.from([0xff, 0xd8]), DIRTY, imageData(200));
    const sealed = (await sealer.sealBytes(`q.${key}/display`, dirtyDisplay))!;
    db.m.set(key, { ...db.m.get(key)!, display: sealed });
    expect(await store.open(uri)).toBeNull();
  });
});

describe('PL-23 blocked or full storage keeps sharing working (PL-23 33, architect: cap 150 MB)', () => {
  it('PL-23 33 IndexedDB blocked: stage still returns the items, durable false, memory-only open works, nothing written, one upload_store_blocked report', async () => {
    const { store, db, reports } = setup({}, { putFails: () => new Error('blocked') });
    const p = prep();
    const r = await store.stage([photo(1), photo(2)], async () => p);
    expect(r.durable).toBe(false);
    expect(r.items.every((i) => i.uri.startsWith('test-q:'))).toBe(true);
    expect(db.m.size).toBe(0);
    expect(Buffer.from((await store.open(r.items[0]!.uri))!.display)).toEqual(Buffer.from(p.display));
    expect(await store.has(r.items[1]!.uri)).toBe(true);
    expect(reports).toEqual(['upload_store_blocked']);
  });

  it('PL-23 33 WebCrypto/key unavailable (sealer says null): memory-only, and no unsealed bytes are ever handed to IndexedDB', async () => {
    const reports: string[] = [];
    const db = mapDb();
    const store = create({ db, sealer: xorSealer({ nullSeal: true }), report: (c) => { reports.push(c); } });
    const r = await store.stage([photo(1)], async () => prep());
    expect(r.durable).toBe(false);
    expect(db.m.size).toBe(0);
    expect(reports).toEqual(['upload_store_blocked']);
  });

  it('PL-23 33 QuotaExceededError: memory-only, one upload_store_full report (code only)', async () => {
    const quota = Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
    const { store, reports } = setup({}, { putFails: () => quota });
    const r = await store.stage([photo(1)], async () => prep());
    expect(r.durable).toBe(false);
    expect(reports).toEqual(['upload_store_full']);
  });

  it('PL-23 33 over the cap: the first post is kept, the second goes memory-only with upload_store_full; sharing is never refused', async () => {
    const one = prep(2000);
    const { store, db, reports } = setup({ capBytes: (one.display.length + one.thumb.length) * 2 });
    const a = await store.stage([photo(1)], async () => one);
    const b = await store.stage([photo(2), photo(3)], async () => one);
    expect(a.durable).toBe(true);
    expect(b.durable).toBe(false);
    expect(reports).toEqual(['upload_store_full']);
    expect(db.m.size).toBe(1);
    expect(await store.has(b.items[1]!.uri)).toBe(true);
  });
});

describe('PL-23 deleting bytes (PL-23 32, PL-23 sweep)', () => {
  it('PL-23 32 release removes the records (and memory copies) of the given uris and only those', async () => {
    const { store, db } = setup();
    const a = await store.stage([photo(1), photo(2)], async () => prep());
    const b = await store.stage([photo(3)], async () => prep());
    await store.release(a.items.map((i) => i.uri));
    expect(db.m.size).toBe(1);
    expect(await store.has(a.items[0]!.uri)).toBe(false);
    expect(await store.open(a.items[1]!.uri)).toBeNull();
    expect(await store.has(b.items[0]!.uri)).toBe(true);
  });

  it('PL-23 32 release also frees a memory-only post', async () => {
    const { store } = setup({}, { putFails: () => new Error('blocked') });
    const r = await store.stage([photo(1)], async () => prep());
    await store.release([r.items[0]!.uri]);
    expect(await store.has(r.items[0]!.uri)).toBe(false);
  });

  it('PL-23 sweep sweep deletes records no saved job points at (a crash between put and save) and keeps the live ones', async () => {
    const { store, db } = setup();
    const live = await store.stage([photo(1)], async () => prep());
    await store.stage([photo(2), photo(3)], async () => prep()); // never saved by any job
    await store.sweep([live.items[0]!.uri]);
    expect([...db.m.keys()]).toEqual([live.items[0]!.uri.replace('test-q:', '')]);
  });

  it('PL-23 32 wipe (sign-out) deletes the whole database and every memory copy', async () => {
    const { store, db } = setup();
    const r = await store.stage([photo(1)], async () => prep());
    const mem = setup({}, { putFails: () => new Error('blocked') });
    const m = await mem.store.stage([photo(2)], async () => prep());
    await store.wipe();
    await mem.store.wipe();
    expect(db.wiped).toBe(1);
    expect(db.m.size).toBe(0);
    expect(await store.has(r.items[0]!.uri)).toBe(false);
    expect(await mem.store.has(m.items[0]!.uri)).toBe(false);
  });
});

describe('PL-23 sign-out during stage (PS-R1)', () => {
  it('PS-R1 a sign-out (sealer clear + wipe) that lands during stage() leaves no sealed record in uploads and mints no new session key', async () => {
    const handed: CryptoKey[] = [];
    let kept: CryptoKey | null = null;
    const keys = { get: async () => kept, put: async (k: CryptoKey) => { kept = k; handed.push(k); }, delete: async () => { kept = null; } };
    const sealer = createSecureSessionStorage({ keys });
    expect(await sealer.sealBytes('q.warm/0/display', new Uint8Array(8))).not.toBeNull(); // a signed-in visit: one key exists
    expect(handed).toHaveLength(1);

    const db = mapDb();
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    const realKeys = db.keys;
    db.keys = async () => { await gate; return realKeys(); }; // stage() is held inside scan(), before any seal or put
    const store = create({ db, sealer, report: () => {} });

    const staging = store.stage([photo(1)], async () => prep()).catch(() => undefined);
    await new Promise((r) => setTimeout(r, 0));
    await sealer.clear(); // sign-out lands now: key deleted
    await store.wipe();
    release();
    await staging;

    expect(db.m.size).toBe(0); // no sealed record written after the wipe
    expect(handed).toHaveLength(1); // no new key minted by the in-flight sealBytes
    expect(kept).toBeNull(); // and none left behind
  });
});

describe('PL-23 options replace the product words', () => {
  const make = (extra: Record<string, unknown>) => {
    const db = mapDb();
    const store = (mod as unknown as { createUploadStore: (o: unknown) => Store }).createUploadStore({
      db, sealer: xorSealer(), report: () => {}, keeps: (i: QueueItem) => i.kind === 'image', verify, ...extra });
    return { db, store };
  };
  it('the default scheme is q: and ids come from crypto.randomUUID', async () => {
    const { store } = make({});
    const r = await store.stage([photo(1)], async () => prep());
    expect(r.items[0]!.uri).toMatch(/^q:[0-9a-f-]{36}\/0$/);
  });
  it('newId and scheme are the app\'s to choose', async () => {
    const { store, db } = make({ scheme: 'mine:', newId: () => 'fixed' });
    const r = await store.stage([photo(1)], async () => prep());
    expect(r.items[0]!.uri).toBe('mine:fixed/0');
    expect([...db.m.keys()]).toEqual(['fixed/0']);
  });
  it('keeps decides which items are prepared: a clip passes through, an image is stored', async () => {
    const { store, db } = make({});
    const prepare = jest.fn(async () => prep());
    const clip: QueueItem = { uri: 'blob:c', kind: 'clip' };
    const r = await store.stage([photo(1), clip], prepare);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(r.items[1]).toEqual(clip);
    expect(db.m.size).toBe(1);
  });
  it('a uri with another scheme is never opened, and has() is false for it', async () => {
    const { store } = make({ scheme: 'mine:' });
    expect(await store.open('q:x/0')).toBeNull();
    expect(await store.has('q:x/0')).toBe(false);
  });
});

describe('PL-23 indexedDbUploadDb and the phone twin', () => {
  it('opens the database under the name the app gives', async () => {
    const opened: string[] = [];
    const idb = { open: (n: string) => { opened.push(n); const r: Record<string, unknown> = {}; setTimeout(() => (r.onerror as () => void)?.(), 0); return r; } };
    const db = mod.indexedDbUploadDb('my.uploads', idb as unknown as IDBFactory);
    await db.keys().catch(() => undefined);
    expect(opened).toEqual(['my.uploads']);
  });
  it('the phone has no byte store: createUploadStore gives null and its database refuses', async () => {
    const native = require('../uploadStore') as typeof import('../uploadStore');
    await expect(native.indexedDbUploadDb().keys()).rejects.toThrow('no IndexedDB');
    expect(native.createUploadStore({ db: mapDb(), sealer: xorSealer(), report: () => {}, keeps: () => true, verify: () => {} })).toBeNull();
  });
});
