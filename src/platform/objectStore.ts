// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Big write-once bytes (keyed text) kept in IndexedDB while the small state saves to storage, because a browser caps
// storage at about 5 MB. idbObjects is the store, createSplitSaver splits a state into the two. Nothing here throws
// from save, know, reset or flush; if the store fails the whole state is saved inline.

/** Where the bytes live, key to text. */
export type ObjectStore = {
  getAll(): Promise<Record<string, string>>;
  put(entries: [string, string][]): Promise<void>;
  clear(): Promise<void>;
};

type SetItem = { setItem(k: string, v: string): void };

// Inline bytes waiting for the store stay well under a 5 MB cap (characters; 2 bytes each).
const INLINE_MAX = 1_000_000;

/** IndexedDB behind ObjectStore; undefined when there is none. Opens lazily on the first call. */
export function idbObjects(o: { name: string; store?: string; idb?: IDBFactory }): ObjectStore | undefined {
  const idb = o.idb ?? (globalThis as { indexedDB?: IDBFactory }).indexedDB;
  if (!idb) return undefined;
  const storeName = o.store ?? 'objects';
  let db: Promise<IDBDatabase> | undefined;
  const open = (): Promise<IDBDatabase> => {
    if (!db) {
      db = new Promise<IDBDatabase>((res, rej) => {
        const r = idb.open(o.name, 1);
        r.onupgradeneeded = () => { r.result.createObjectStore(storeName); };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.onblocked = () => rej(new Error('blocked'));
      });
      db.catch(() => { db = undefined; }); // a failed open may be tried again
    }
    return db;
  };
  const run = async <T>(mode: IDBTransactionMode, f: (s: IDBObjectStore) => () => T): Promise<T> => {
    const t = (await open()).transaction(storeName, mode);
    const done = f(t.objectStore(storeName));
    return new Promise<T>((res, rej) => {
      t.oncomplete = () => res(done());
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error ?? new Error('aborted'));
    });
  };
  return {
    getAll: () => run('readonly', (s) => {
      const keys = s.getAllKeys();
      const vals = s.getAll();
      return () => Object.fromEntries(keys.result.map((k, i) => [String(k), vals.result[i] as string]));
    }),
    put: (entries) => run('readwrite', (s) => { for (const [k, v] of entries) s.put(v, k); return () => undefined; }),
    clear: () => run('readwrite', (s) => { s.clear(); return () => undefined; }),
  };
}

export interface SplitSaver<S> {
  save(state: S): void;
  /** Keys already in the store (after a load), so they are not written again. */
  know(keys: string[]): void;
  /** A fresh state: drop the old bytes first and forget which keys were stored. */
  reset(): void;
  flush(): Promise<void>;
}

/**
 * Saves the state to storage at once, with bytes not yet in the store kept inline until they land there (so a reload
 * right after a change keeps it). A batch bigger than inlineMax waits for the store instead. Without a store, or once
 * it fails, the whole state is saved inline.
 */
export function createSplitSaver<S extends { objects: Record<string, string> }>(o: { storage: SetItem; key: string; store?: ObjectStore; inlineMax?: number }): SplitSaver<S> {
  const store = o.store;
  const inlineMax = o.inlineMax ?? INLINE_MAX;
  let stored = new Set<string>();
  let pending = new Map<string, string>();
  let latest: S | undefined;
  let chain: Promise<void> = Promise.resolve();
  let inline = !store;
  const write = (): void => {
    if (!latest) return;
    try {
      const v = inline ? JSON.stringify(latest) : JSON.stringify({ ...latest, objects: Object.fromEntries(pending) });
      o.storage.setItem(o.key, v);
    } catch { /* full or blocked: the next write tries again */ }
  };
  return {
    save(s) {
      try {
        latest = s;
        if (inline || !store) { write(); return; }
        const fresh: [string, string][] = [];
        for (const k of Object.keys(s.objects)) {
          if (!stored.has(k) && !pending.has(k)) {
            const v = s.objects[k] as string;
            pending.set(k, v);
            fresh.push([k, v]);
          }
        }
        let size = 0;
        for (const v of pending.values()) size += v.length;
        if (size <= inlineMax) write();
        if (!fresh.length) return;
        const batch = pending;
        chain = chain.then(() => store.put(fresh)).then(() => {
          if (batch !== pending) return; // reset since: these bytes belong to the old state
          for (const [k] of fresh) { stored.add(k); pending.delete(k); }
          write();
        }, () => { inline = true; write(); });
      } catch { /* never throws */ }
    },
    know(keys) { for (const k of keys) stored.add(k); },
    reset() {
      stored = new Set();
      pending = new Map();
      chain = chain.then(() => store?.clear()).catch(() => undefined);
    },
    flush: () => chain,
  };
}

/** True when every required key has non-empty bytes (a store wiped by the browser leaves gaps). Own keys only. */
export function objectsPresent(objects: Record<string, string>, required: string[]): boolean {
  return required.every((k) => Object.prototype.hasOwnProperty.call(objects, k) && !!objects[k]);
}
