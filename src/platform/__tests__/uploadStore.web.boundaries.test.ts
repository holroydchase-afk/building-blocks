// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-23 boundaries (qa-tdd post-build): cap edge, empty and pass-through input, release/sweep edges, throwing sealer or db.
// PL-23: the web upload byte store, generic. Files a person picked are prepared (cleaned) BEFORE the job is saved, sealed
// with the session key and kept in IndexedDB under `<stageId>/<index>`; the queue item's uri becomes `<scheme><stageId>/<index>`.
// Jest uses an injected Map fake for IndexedDB. Moved over from the app it was first built in, with its words turned into
// options (the kept test, the cleanliness check, the scheme). Written first (red) by qa-tdd, 2026-11-28.
import * as mod from '../uploadStore.web';

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

function setup(extra: Partial<Opts> = {}, dbOpts: Parameters<typeof mapDb>[0] = {}) {
  const db = mapDb(dbOpts);
  const sealer = xorSealer();
  const reports: string[] = [];
  const store = create({ db, sealer, report: (c) => { reports.push(c); }, ...extra });
  return { db, sealer, reports, store };
}


const recSize = (r: Rec) => r.spec.length + r.display.length + r.thumb.length;

describe('PL-23 boundaries (QA post-build)', () => {
  it('PL-23 B1 cap: a post whose sealed size equals the cap exactly is kept; one byte less is not', async () => {
    const one = prep(300);
    const probe = setup();
    await probe.store.stage([photo(1)], async () => one);
    const size = recSize([...probe.db.m.values()][0]!);
    const at = setup({ capBytes: size });
    expect((await at.store.stage([photo(1)], async () => one)).durable).toBe(true);
    const under = setup({ capBytes: size - 1 });
    const r = await under.store.stage([photo(1)], async () => one);
    expect(r.durable).toBe(false);
    expect(under.reports).toEqual(['upload_store_full']);
  });

  it('PL-23 B2 capBytes 0: nothing is saved, sharing still works from memory with one full report', async () => {
    const { store, db, reports } = setup({ capBytes: 0 });
    const r = await store.stage([photo(1)], async () => prep());
    expect(r.durable).toBe(false);
    expect(db.m.size).toBe(0);
    expect(reports).toEqual(['upload_store_full']);
    expect(await store.open(r.items[0]!.uri)).not.toBeNull();
  });

  it('PL-23 B3 an empty list and an all-clip list never touch the database, are durable and report nothing', async () => {
    const { store, db, reports } = setup();
    const prepare = jest.fn(async () => prep());
    expect(await store.stage([], prepare)).toEqual({ items: [], durable: true });
    const clips: QueueItem[] = [{ uri: 'blob:x', kind: 'clip', durationMs: 0 }];
    expect((await store.stage(clips, prepare)).items).toEqual(clips);
    expect(prepare).not.toHaveBeenCalled();
    expect(db.m.size).toBe(0);
    expect(reports).toEqual([]);
  });

  it('PL-23 B4 progress counts only kept items when clips are mixed in (total excludes clips)', async () => {
    const { store } = setup();
    const calls: [number, number][] = [];
    await store.stage([photo(1), { uri: 'blob:c', kind: 'clip' }, photo(2)], async () => prep(), (d, t) => calls.push([d, t]));
    expect(calls).toEqual([[1, 2], [2, 2]]);
  });

  it('PL-23 B5 release of an unknown uri, another scheme or a repeat never throws and never frees cap twice', async () => {
    const one = prep(800);
    const probe = setup();
    await probe.store.stage([photo(1)], async () => one);
    const size = recSize([...probe.db.m.values()][0]!);
    const { store, reports } = setup({ capBytes: size });
    const a = await store.stage([photo(1)], async () => one);
    await store.release([a.items[0]!.uri, a.items[0]!.uri, 'other:zzz', SCHEME + 'nope/0', 'garbage']);
    expect((await store.stage([photo(2)], async () => one)).durable).toBe(true); // freed once
    expect((await store.stage([photo(3)], async () => one)).durable).toBe(false); // not freed twice
    expect(reports).toEqual(['upload_store_full']);
  });

  it('PL-23 B6 sweep with no live uris deletes every record; sweep on an empty database is quiet', async () => {
    const { store, db } = setup();
    await store.sweep([]);
    await store.stage([photo(1), photo(2)], async () => prep());
    expect(db.m.size).toBe(2);
    await store.sweep([]);
    expect(db.m.size).toBe(0);
  });

  it('PL-23 B7 after wipe the same store stages and opens again (not stuck closed), and the cap starts from zero', async () => {
    const one = prep(500);
    const { store, db } = setup();
    await store.stage([photo(1)], async () => one);
    await store.wipe();
    const r = await store.stage([photo(2)], async () => one);
    expect(r.durable).toBe(true);
    expect(db.m.size).toBe(1);
    expect(await store.open(r.items[0]!.uri)).not.toBeNull();
  });

  it('PL-23 B8 a record with an unknown version opens as null and has() is still honest', async () => {
    const { store, db } = setup();
    const r = await store.stage([photo(1)], async () => prep());
    const key = r.items[0]!.uri.slice(SCHEME.length);
    db.m.set(key, { ...db.m.get(key)!, v: 2 });
    expect(await store.open(r.items[0]!.uri)).toBeNull();
  });

  it('PL-23 B9 a sealer that rejects (not just says null) keeps the post in memory with a blocked report', async () => {
    const sealer = { sealBytes: async () => { throw new Error('boom'); }, openBytes: async () => null };
    const db = mapDb();
    const reports: string[] = [];
    const store = create({ db, sealer, report: (c) => { reports.push(c); } });
    const r = await store.stage([photo(1)], async () => prep()).catch((e: unknown) => e);
    expect(r).not.toBeInstanceOf(Error);
    expect(db.m.size).toBe(0);
    expect(reports).toEqual(['upload_store_blocked']);
  });

  it('PL-23 B10 a database whose keys() fails at the first scan is blocked, not a crash; the next stage retries the scan', async () => {
    const db = mapDb();
    let fail = true;
    const keys = db.keys;
    db.keys = async () => { if (fail) throw new Error('blocked'); return keys(); };
    const reports: string[] = [];
    const store = create({ db, sealer: xorSealer(), report: (c) => { reports.push(c); } });
    expect((await store.stage([photo(1)], async () => prep())).durable).toBe(false);
    fail = false;
    expect((await store.stage([photo(2)], async () => prep())).durable).toBe(true);
    expect(reports).toEqual(['upload_store_blocked']);
  });

  it('PL-23 B11 a report callback that throws never blocks sharing', async () => {
    const { store } = setup({ capBytes: 0, report: () => { throw new Error('reporter down'); } });
    const r = await store.stage([photo(1)], async () => prep());
    expect(r.durable).toBe(false);
  });

  it('PL-23 B12 verify failing on the thumb alone (display clean) refuses the stage and writes nothing', async () => {
    const { store, db } = setup();
    const p = prep();
    const bad = { ...p, thumb: jpeg(p.thumb, DIRTY) };
    await expect(store.stage([photo(1)], async () => bad)).rejects.toMatchObject({ code: 'META_EXIF' });
    expect(db.m.size).toBe(0);
  });
});
