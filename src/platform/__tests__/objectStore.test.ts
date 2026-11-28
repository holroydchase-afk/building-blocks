// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-12 (docs/product/SPEC-APP-KIT-STATE.md). Written first (red) by qa-tdd, 2026-11-28, CL-36..CL-40. Seeded from a
// product's own split-save tests. Contract, src/platform/objectStore.ts (one file, no React Native imports):
//   type ObjectStore = { getAll(): Promise<Record<string,string>>; put(entries: [string,string][]): Promise<void>; clear(): Promise<void> }
//   idbObjects({ name: string; store?: string; idb?: IDBFactory }): ObjectStore | undefined   (undefined when no IndexedDB)
//   createSplitSaver<S extends { objects: Record<string,string> }>({ storage: { setItem }, key, store?, inlineMax? }) -> { save(s), know(keys), reset(), flush() }
//   objectsPresent(objects: Record<string,string>, required: string[]): boolean
// Also exported from src/platform/index.ts.
import * as platform from '../index';
import { createSplitSaver, idbObjects, objectsPresent, type ObjectStore } from '../objectStore';

type S = { objects: Record<string, string>; tag?: string };

function memStore(fail = false) {
  const data: Record<string, string> = {};
  const puts: string[][] = [];
  const store: ObjectStore = {
    getAll: async () => ({ ...data }),
    put: async (e) => { if (fail) throw new Error('quota'); puts.push(e.map(([k]) => k)); e.forEach(([k, v]) => { data[k] = v; }); },
    clear: async () => { for (const k of Object.keys(data)) delete data[k]; },
  };
  return { store, data, puts };
}
const memLS = () => { const m = new Map<string, string>(); return { m, setItem: (k: string, v: string) => { m.set(k, v); } }; };
const st = (objects: Record<string, string>, tag?: string): S => ({ objects, ...(tag ? { tag } : {}) });
const saved = (ls: { m: Map<string, string> }, key = 'k') => JSON.parse(ls.m.get(key)!) as S;

describe('CL-36 createSplitSaver', () => {
  it('CL-36 the state goes to storage without the bytes; the bytes go to the store', async () => {
    const ls = memLS();
    const { store, data } = memStore();
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store });
    s.save(st({ a: 'AAAA', b: 'BBBB' }));
    await s.flush();
    expect(saved(ls).objects).toEqual({});
    expect(data).toEqual({ a: 'AAAA', b: 'BBBB' });
  });

  it('CL-36 bytes not yet in the store stay inline so a reload right after keeps them', async () => {
    const ls = memLS();
    const { store } = memStore();
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store, inlineMax: 10 });
    s.save(st({ a: 'AAAA' }));
    expect(saved(ls).objects).toEqual({ a: 'AAAA' });
    await s.flush();
    expect(saved(ls).objects).toEqual({});
  });

  it('CL-36 a big batch waits for the store and is never written inline; the state is written once stored', async () => {
    const ls = memLS();
    const { store } = memStore();
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store, inlineMax: 10 });
    s.save(st({ a: 'AAAAAAAA', b: 'BBBBBBBB' }));
    expect(ls.m.has('k')).toBe(false);
    await s.flush();
    expect(saved(ls).objects).toEqual({});
  });

  it('CL-36 boundary: pending bytes exactly at inlineMax are written inline, one character more waits', async () => {
    const at = memLS();
    createSplitSaver<S>({ storage: at, key: 'k', store: memStore().store, inlineMax: 8 }).save(st({ a: 'AAAABBBB' }));
    expect(at.m.has('k')).toBe(true);
    const over = memLS();
    createSplitSaver<S>({ storage: over, key: 'k', store: memStore().store, inlineMax: 8 }).save(st({ a: 'AAAABBBBC' }));
    expect(over.m.has('k')).toBe(false);
  });

  it('CL-36 the default inline limit is one million characters', async () => {
    const at = memLS();
    createSplitSaver<S>({ storage: at, key: 'k', store: memStore().store }).save(st({ a: 'x'.repeat(1_000_000) }));
    expect(at.m.has('k')).toBe(true);
    const over = memLS();
    createSplitSaver<S>({ storage: over, key: 'k', store: memStore().store }).save(st({ a: 'x'.repeat(1_000_001) }));
    expect(over.m.has('k')).toBe(false);
  });

  it('CL-36 a save with no objects at all is written at once and puts nothing', async () => {
    const ls = memLS();
    const { store, puts } = memStore();
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store });
    s.save(st({}, 'only'));
    expect(saved(ls).tag).toBe('only');
    await s.flush();
    expect(puts).toEqual([]);
  });

  it('CL-36 bytes are written once; later saves only add new keys; know() marks keys already stored', async () => {
    const { store, puts } = memStore();
    const s = createSplitSaver<S>({ storage: memLS(), key: 'k', store });
    s.know(['a']);
    const state = st({ a: 'AAAA', b: 'BBBB' });
    s.save(state);
    state.objects.c = 'CCCC';
    s.save(state);
    s.save(state);
    await s.flush();
    expect(puts).toEqual([['b'], ['c']]);
  });

  it('CL-36 the last save wins even when an earlier one waited on its bytes', async () => {
    const ls = memLS();
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store: memStore().store });
    s.save(st({ a: 'AAAA' }, 'first'));
    s.save(st({ a: 'AAAA' }, 'second'));
    await s.flush();
    expect(saved(ls).tag).toBe('second');
  });

  it('CL-36 with no store, or once the store fails, the whole state is saved inline', async () => {
    const a = memLS();
    createSplitSaver<S>({ storage: a, key: 'k' }).save(st({ a: 'AAAA' }));
    expect(saved(a).objects).toEqual({ a: 'AAAA' });
    const b = memLS();
    const s = createSplitSaver<S>({ storage: b, key: 'k', store: memStore(true).store });
    s.save(st({ a: 'AAAA' }));
    s.save(st({ a: 'AAAA' }));
    await s.flush();
    expect(saved(b).objects).toEqual({ a: 'AAAA' });
    s.save(st({ a: 'AAAA', z: 'ZZZZ' })); // and it stays inline afterwards
    expect(saved(b).objects).toEqual({ a: 'AAAA', z: 'ZZZZ' });
  });

  it('CL-36 reset clears the store before a fresh state saves, and forgets which keys were stored', async () => {
    const { store, data, puts } = memStore();
    data.old = 'OLD';
    const s = createSplitSaver<S>({ storage: memLS(), key: 'k', store });
    s.know(['a']);
    s.reset();
    s.save(st({ a: 'AAAA' }));
    await s.flush();
    expect(data).toEqual({ a: 'AAAA' });
    expect(puts).toEqual([['a']]); // a was forgotten by reset, so it is written
  });

  it('CL-36 reset while bytes are still on their way drops them: the old batch never lands in the state', async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => { release = r; });
    const data: Record<string, string> = {};
    const store: ObjectStore = {
      getAll: async () => ({ ...data }),
      put: async (e) => { await gate; e.forEach(([k, v]) => { data[k] = v; }); },
      clear: async () => { for (const k of Object.keys(data)) delete data[k]; },
    };
    const ls = memLS();
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store });
    s.save(st({ old: 'OLD' }, 'old-state'));
    s.reset();
    release();
    await s.flush();
    expect(data).toEqual({}); // the late put was cleared away
    expect(saved(ls).tag).toBe('old-state'); // the inline write from before; nothing newer overwrote it with old bytes
    expect(saved(ls).objects).toEqual({ old: 'OLD' });
  });

  it('CL-36 reset with no store does not throw and flush still resolves', async () => {
    const s = createSplitSaver<S>({ storage: memLS(), key: 'k' });
    s.reset();
    await expect(s.flush()).resolves.toBeUndefined();
  });

  it('CL-36 never throws or rejects: storage that is full, a store that fails, a clear that fails', async () => {
    const full = { setItem: () => { throw new Error('QuotaExceededError'); } };
    const failing: ObjectStore = { getAll: async () => ({}), put: async () => { throw new Error('x'); }, clear: async () => { throw new Error('y'); } };
    const s = createSplitSaver<S>({ storage: full, key: 'k', store: failing });
    expect(() => s.save(st({ a: 'AAAA' }))).not.toThrow();
    expect(() => s.reset()).not.toThrow();
    await expect(s.flush()).resolves.toBeUndefined();
  });

  it('CL-36 hostile: an object key named __proto__ is stored like any other (not skipped as already known)', async () => {
    const objects = JSON.parse('{"__proto__":"PPPP","a":"AAAA"}') as Record<string, string>;
    const { store, data } = memStore();
    const s = createSplitSaver<S>({ storage: memLS(), key: 'k', store });
    s.save({ objects });
    await s.flush();
    expect(Object.keys(data).sort()).toEqual(['__proto__', 'a']);
  });

  it('CL-36 the saver is exported from the platform entry', () => {
    expect(typeof platform.createSplitSaver).toBe('function');
    expect(typeof platform.idbObjects).toBe('function');
    expect(typeof platform.objectsPresent).toBe('function');
  });
});

describe('CL-37 objectsPresent', () => {
  it('CL-37 true when every required key has bytes; extra keys do not matter', () => {
    expect(objectsPresent({ a: 'A', b: 'B', c: 'C' }, ['a', 'b'])).toBe(true);
  });

  it('CL-37 false when any required key is missing', () => {
    expect(objectsPresent({ a: 'A' }, ['a', 'b'])).toBe(false);
    expect(objectsPresent({}, ['a'])).toBe(false);
  });

  it('CL-37 an empty value counts as missing', () => {
    expect(objectsPresent({ a: '' }, ['a'])).toBe(false);
  });

  it('CL-37 boundary: nothing required is always present (even with no objects)', () => {
    expect(objectsPresent({}, [])).toBe(true);
    expect(objectsPresent({ a: 'A' }, [])).toBe(true);
  });

  it('CL-37 hostile: inherited names are not present bytes', () => {
    for (const k of ['toString', 'constructor', '__proto__', 'hasOwnProperty', 'valueOf']) expect(objectsPresent({}, [k])).toBe(false);
  });
});

// A small in-memory IndexedDB, enough for open / upgrade / one store / the three calls the wrapper makes.
function fakeIdb(opts: { failOpen?: boolean } = {}) {
  const dbs = new Map<string, Map<string, Map<string, string>>>();
  const opened: string[] = [];
  const factory = {
    open(name: string) {
      opened.push(name);
      const req: { result?: unknown; error?: unknown; onsuccess?: () => void; onerror?: () => void; onupgradeneeded?: () => void; onblocked?: () => void } = {};
      setTimeout(() => {
        if (opts.failOpen) { req.error = new Error('denied'); req.onerror?.(); return; }
        let stores = dbs.get(name);
        const fresh = !stores;
        if (!stores) { stores = new Map(); dbs.set(name, stores); }
        const all = stores;
        req.result = {
          createObjectStore: (s: string) => { all.set(s, new Map()); },
          transaction: (s: string) => {
            const table = all.get(s);
            if (!table) throw new Error('NotFoundError');
            const tx: { oncomplete?: () => void; onerror?: () => void; onabort?: () => void; objectStore: () => unknown } = {
              objectStore: () => ({
                getAllKeys: () => ({ result: [...table.keys()] }),
                getAll: () => ({ result: [...table.values()] }),
                put: (v: string, k: string) => { table.set(k, v); },
                clear: () => { table.clear(); },
              }),
            };
            setTimeout(() => tx.oncomplete?.(), 0);
            return tx;
          },
        };
        if (fresh) req.onupgradeneeded?.();
        req.onsuccess?.();
      }, 0);
      return req;
    },
  };
  return { idb: factory as unknown as IDBFactory, dbs, opened };
}

describe('CL-38 idbObjects', () => {
  it('CL-38 no IndexedDB (none given, none global): undefined, so callers fall back to inline saving', () => {
    const g = globalThis as { indexedDB?: unknown };
    const had = 'indexedDB' in g;
    const old = g.indexedDB;
    delete g.indexedDB;
    try {
      expect(idbObjects({ name: 'x' })).toBeUndefined();
      expect(idbObjects({ name: 'x', idb: undefined })).toBeUndefined();
    } finally {
      if (had) g.indexedDB = old;
    }
  });

  it('CL-38 uses the global IndexedDB when none is passed', async () => {
    const g = globalThis as { indexedDB?: unknown };
    const had = 'indexedDB' in g;
    const old = g.indexedDB;
    const { idb, opened } = fakeIdb();
    g.indexedDB = idb;
    try {
      const o = idbObjects({ name: 'from-global' });
      expect(o).toBeDefined();
      await o!.put([['a', 'A']]);
      expect(opened).toEqual(['from-global']);
    } finally {
      if (had) g.indexedDB = old; else delete g.indexedDB;
    }
  });

  it('CL-38 put, getAll and clear round-trip, and the database is named by the caller', async () => {
    const { idb, dbs } = fakeIdb();
    const o = idbObjects({ name: 'my-objects', idb })!;
    expect(await o.getAll()).toEqual({});
    await o.put([['a', 'AAAA'], ['b', 'BBBB']]);
    await o.put([['b', 'BBB2']]);
    expect(await o.getAll()).toEqual({ a: 'AAAA', b: 'BBB2' });
    expect([...dbs.keys()]).toEqual(['my-objects']);
    await o.clear();
    expect(await o.getAll()).toEqual({});
  });

  it('CL-38 a custom store name is the one that is created and used', async () => {
    const { idb, dbs } = fakeIdb();
    const o = idbObjects({ name: 'n', store: 'blobs', idb })!;
    await o.put([['a', 'A']]);
    expect([...dbs.get('n')!.keys()]).toEqual(['blobs']);
    expect(await o.getAll()).toEqual({ a: 'A' });
  });

  it('CL-38 the store name has a default, so an app that gives only a name still works', async () => {
    const { idb } = fakeIdb();
    const o = idbObjects({ name: 'n', idb })!;
    await o.put([['a', 'A']]);
    expect(await o.getAll()).toEqual({ a: 'A' });
  });

  it('CL-38 two names on one factory do not share bytes', async () => {
    const { idb } = fakeIdb();
    const a = idbObjects({ name: 'one', idb })!;
    const b = idbObjects({ name: 'two', idb })!;
    await a.put([['k', 'A']]);
    expect(await b.getAll()).toEqual({});
  });

  it('CL-38 boundary: an empty put and a huge value work', async () => {
    const { idb } = fakeIdb();
    const o = idbObjects({ name: 'n', idb })!;
    await o.put([]);
    await o.put([['big', 'x'.repeat(2_000_000)]]);
    expect((await o.getAll()).big).toHaveLength(2_000_000);
  });

  it('CL-38 a database that cannot be opened rejects the call (the saver then falls back to inline)', async () => {
    const o = idbObjects({ name: 'n', idb: fakeIdb({ failOpen: true }).idb })!;
    await expect(o.getAll()).rejects.toBeDefined();
    await expect(o.put([['a', 'A']])).rejects.toBeDefined();
  });

  it('CL-38 opening is lazy: nothing is opened until the first call', () => {
    const { idb, opened } = fakeIdb();
    idbObjects({ name: 'n', idb });
    expect(opened).toEqual([]);
  });
});
