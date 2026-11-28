// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// The web upload byte store: files a person picked are prepared (resized, cleaned of private data) BEFORE the upload job
// is saved, then each cleaned file is sealed with the session store's key (secureSession.web sealBytes: this module never
// reads or makes a key) and kept in an IndexedDB database, one record per file under `<stageId>/<index>`. The queue
// item's uri becomes `<scheme><stageId>/<index>`. Deleted when the upload publishes or is removed (release), at sign-out
// (wipe: the whole database) and on the next open for records no saved job points at (sweep). 150 MB cap by default; over
// it, or blocked, or full, or no WebCrypto: that post stays in memory only (never refused), with one code-only report.
// Product words are options: the database name, the uri scheme, which items are kept, the cleanliness check.
import type { ByteSealer, Prepared, QueuedItem, UploadDb, UploadRecord, UploadStore, UploadStoreOptions, UploadStoreReport } from './uploadStoreTypes';

export type { ByteSealer, Prepared, QueuedItem, UploadDb, UploadRecord, UploadStore, UploadStoreOptions, UploadStoreReport };

const OS_NAME = 'items';
const DEFAULT_DB_NAME = 'uploads';
const DEFAULT_SCHEME = 'q:';
const DEFAULT_CAP = 150 * 1024 * 1024;

const enc = new TextEncoder();
const dec = new TextDecoder();
const randomId = () => globalThis.crypto.randomUUID();
const recBytes = (r: UploadRecord) => r.spec.length + r.display.length + r.thumb.length;
const isQuota = (e: unknown) => (e as { name?: string } | null)?.name === 'QuotaExceededError';

export function createUploadStore<Item extends QueuedItem, P extends Prepared>(o: UploadStoreOptions<Item>): UploadStore<Item, P> {
  const { db, sealer } = o;
  const cap = o.capBytes ?? DEFAULT_CAP;
  const SCHEME = o.scheme ?? DEFAULT_SCHEME;
  const newId = o.newId ?? randomId;
  const keyOf = (uri: string) => (uri.startsWith(SCHEME) ? uri.slice(SCHEME.length) : null);
  /** Items of posts that could not be saved this visit, by key. */
  const mem = new Map<string, P>();
  /** Sealed bytes per stored key; read from the database the first time a post is staged. */
  const sizes = new Map<string, number>();
  let scanned = false;
  let used = 0;
  /** PRIV-WEB3-R1: bumped by wipe() (sign-out). A stage or put that started under an older one writes nothing and seals nothing. */
  let gen = 0;

  async function scan(g: number): Promise<void> {
    if (scanned) return;
    const ks = await db.keys();
    for (const k of ks) {
      if (g !== gen) throw 'gone';
      const r = await db.get(k);
      if (g !== gen) throw 'gone';
      if (r) { const n = recBytes(r); sizes.set(k, n); used += n; }
    }
    if (g !== gen) throw 'gone';
    scanned = true; // only after a whole read, so a blocked first try is retried
  }

  async function drop(key: string): Promise<void> {
    mem.delete(key);
    used -= sizes.get(key) ?? 0;
    sizes.delete(key);
    try { await db.delete(key); } catch { /* blocked: nothing was saved there */ }
  }

  /** Seals and puts one item. Throws a short reason string when it cannot be kept. */
  async function put(key: string, p: P, g: number): Promise<void> {
    const parts: [string, Uint8Array][] = [['display', p.display], ['spec', enc.encode(JSON.stringify(p.spec))], ['thumb', p.thumb]];
    const sealed: Record<string, Uint8Array> = {};
    for (const [name, bytes] of parts) {
      if (g !== gen) throw 'gone'; // sign-out landed: never ask the sealer (it would mint a fresh key)
      const s = await sealer.sealBytes(`q.${key}/${name}`, bytes);
      if (g !== gen) throw 'gone';
      if (!s) throw 'blocked';
      sealed[name] = s;
    }
    const rec: UploadRecord = { v: 1, spec: sealed.spec!, display: sealed.display!, thumb: sealed.thumb! };
    const n = recBytes(rec);
    if (used + n > cap) throw 'full';
    if (g !== gen) throw 'gone';
    try { await db.put(key, rec); } catch (e) { throw isQuota(e) ? 'full' : 'blocked'; }
    if (g !== gen) { try { await db.delete(key); } catch { /* blocked */ } throw 'gone'; }
    sizes.set(key, n);
    used += n;
  }

  return {
    async stage(items, prepare, onProgress) {
      const stageId = newId();
      const g = gen;
      const total = items.filter((i) => o.keeps(i)).length;
      const out: Item[] = [];
      const ready: { key: string; p: P }[] = [];
      let done = 0;
      for (let i = 0; i < items.length; i++) {
        const item = items[i]!;
        if (!o.keeps(item)) { out.push(item); continue; }
        const p = await prepare(item);
        o.verify(p.display); // fails closed (whatever it throws); nothing has been written yet
        o.verify(p.thumb);
        const key = `${stageId}/${i}`;
        ready.push({ key, p });
        out.push({ ...item, uri: SCHEME + key });
        onProgress?.(++done, total);
      }
      if (!ready.length) return { items: out, durable: true };
      let durable = true;
      try {
        await scan(g);
        for (const r of ready) await put(r.key, r.p, g);
      } catch (why) {
        if (why === 'gone' || g !== gen) {
          // Signed out mid-stage: nothing stays (db, memory) and the caller is told it didn't happen.
          for (const r of ready) { mem.delete(r.key); try { await db.delete(r.key); } catch { /* blocked */ } }
          throw new Error('signed out');
        }
        durable = false;
        for (const r of ready) await drop(r.key); // all or nothing: a half-saved post would fail at the next open
        try { o.report(why === 'full' ? 'upload_store_full' : 'upload_store_blocked'); } catch { /* reporting never blocks */ }
        for (const r of ready) mem.set(r.key, r.p);
      }
      return { items: out, durable };
    },

    async open(uri) {
      const key = keyOf(uri);
      if (!key) return null;
      const m = mem.get(key);
      if (m) return m;
      try {
        const rec = await db.get(key);
        if (!rec || rec.v !== 1) return null;
        const [display, thumb, spec] = await Promise.all([
          sealer.openBytes(`q.${key}/display`, rec.display), sealer.openBytes(`q.${key}/thumb`, rec.thumb), sealer.openBytes(`q.${key}/spec`, rec.spec)]);
        if (!display || !thumb || !spec) return null;
        o.verify(display); // a record from an old build or a tampered one fails closed
        o.verify(thumb);
        return { spec: JSON.parse(dec.decode(spec)) as P['spec'], display, thumb } as P;
      } catch {
        return null;
      }
    },

    async has(uri) {
      const key = keyOf(uri);
      if (!key) return false;
      if (mem.has(key)) return true;
      try {
        const rec = await db.get(key);
        // The spec must open too: with the key gone (cleared site data) the post can't be sent, so it isn't "there".
        return !!rec && !!(await sealer.openBytes(`q.${key}/spec`, rec.spec));
      } catch {
        return false;
      }
    },

    memoryOnly: (uri) => { const k = keyOf(uri); return !!k && mem.has(k); },

    async release(uris) {
      for (const u of uris) { const k = keyOf(u); if (k) await drop(k); }
    },

    async sweep(liveUris) {
      const live = new Set(liveUris.map(keyOf).filter((k): k is string => !!k));
      try {
        for (const k of await db.keys()) if (!live.has(k)) await drop(k);
      } catch { /* blocked */ }
    },

    async wipe() {
      gen += 1;
      mem.clear();
      sizes.clear();
      used = 0;
      scanned = false;
      try { await db.wipe(); } catch { /* blocked: the key is deleted at sign-out too, so leftovers can't be opened */ }
    },
  };
}

/** The real database: raw IndexedDB, no dependency (same style as indexedDbKeyStore). */
export function indexedDbUploadDb(dbName = DEFAULT_DB_NAME, idb: IDBFactory | undefined = (globalThis as { indexedDB?: IDBFactory }).indexedDB): UploadDb {
  let db: Promise<IDBDatabase> | undefined;
  const openDb = () => {
    if (!idb) return Promise.reject(new Error('no IndexedDB'));
    return (db ??= new Promise<IDBDatabase>((res, rej) => {
      const r = idb.open(dbName, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(OS_NAME); };
      r.onsuccess = () => {
        const d = r.result;
        d.onversionchange = () => { d.close(); db = undefined; }; // another tab's sign-out may delete the database
        res(d);
      };
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('blocked'));
    }).catch((e) => { db = undefined; throw e; }));
  };
  const run = async <T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const t = (await openDb()).transaction(OS_NAME, mode);
    const r = f(t.objectStore(OS_NAME));
    return new Promise<T>((res, rej) => {
      t.oncomplete = () => res(r.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error ?? new Error('aborted'));
    });
  };
  return {
    get: (k) => run('readonly', (s) => s.get(k) as IDBRequest<UploadRecord | undefined>),
    put: async (k, r) => { await run('readwrite', (s) => s.put(r, k)); },
    delete: async (k) => { await run('readwrite', (s) => s.delete(k)); },
    keys: async () => (await run('readonly', (s) => s.getAllKeys())).map(String),
    wipe: async () => {
      if (!idb) return;
      const open = db;
      db = undefined;
      if (open) { try { (await open).close(); } catch { /* never opened */ } }
      await new Promise<void>((res) => {
        const r = idb.deleteDatabase(dbName);
        r.onsuccess = () => res();
        r.onerror = () => res();
        r.onblocked = () => res(); // another tab still has it open: it closes on versionchange and the delete finishes
      });
    },
  };
}

