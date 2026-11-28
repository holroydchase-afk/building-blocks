// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-41 (PS-R1, PS-R3, PS-R4) privacy-security review of the object store. Written first (red) by qa-tdd, 2026-11-28.
// Contract changes, src/platform/objectStore.ts:
//   createSplitSaver({ ..., storage: { setItem, removeItem? }, onError?: (code: 'put' | 'clear' | 'write') => void })
//   reset(): Promise<void>: forgets latest and pending, calls storage.removeItem(key) if present, resolves when the
//     store clear is done, never rejects; a failed clear is reported as onError('clear').
//   onError gets a code only; a throwing onError is ignored. put failure 'put' (then inline), setItem failure 'write'.
//   idbObjects drops its cached connection on db.onclose and db.onversionchange (closing the db on versionchange).
import { createSplitSaver, idbObjects, type ObjectStore } from '../objectStore';

type S = { objects: Record<string, string> };
const st = (objects: Record<string, string>): S => ({ objects });

function deferredStore() {
  let release!: (ok: boolean) => void;
  const gate = new Promise<boolean>((r) => { release = r; });
  const data: Record<string, string> = {};
  const store: ObjectStore = {
    getAll: async () => ({ ...data }),
    put: async (e) => { if (!(await gate)) throw new Error('quota'); e.forEach(([k, v]) => { data[k] = v; }); },
    clear: async () => { for (const k of Object.keys(data)) delete data[k]; },
  };
  return { store, release, data };
}
const spyLS = () => {
  const sets: string[] = [];
  const removed: string[] = [];
  return { sets, removed, setItem: (_k: string, v: string) => { sets.push(v); }, removeItem: (k: string) => { removed.push(k); } };
};

describe('CL-41 PS-R1 reset forgets the old state', () => {
  it('CL-41 a put in flight that FAILS after reset never writes the pre-reset state back', async () => {
    const ls = spyLS();
    const { store, release } = deferredStore();
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store, inlineMax: 5 });
    s.save(st({ secret: 'PRIVATE-BYTES' })); // big: waits for the store, nothing written yet
    const done = s.reset();
    release(false); // the old put now fails
    await done;
    await s.flush();
    expect(ls.sets.join('|')).not.toContain('PRIVATE-BYTES');
  });

  it('CL-41 a put in flight that LANDS after reset writes nothing from the old state', async () => {
    const ls = spyLS();
    const { store, release } = deferredStore();
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store, inlineMax: 5 });
    s.save(st({ secret: 'PRIVATE-BYTES' }));
    const done = s.reset();
    release(true);
    await done;
    await s.flush();
    expect(ls.sets).toEqual([]);
  });

  it('CL-41 reset calls storage.removeItem(key) when the storage has one, and works without one', async () => {
    const ls = spyLS();
    await createSplitSaver<S>({ storage: ls, key: 'the-key', store: deferredStore().store }).reset();
    expect(ls.removed).toEqual(['the-key']);
    const bare = { setItem: jest.fn() };
    await expect(createSplitSaver<S>({ storage: bare, key: 'k' }).reset()).resolves.toBeUndefined();
  });

  it('CL-41 reset returns a promise that resolves only after the store clear finished', async () => {
    let cleared = false;
    let finish!: () => void;
    const store: ObjectStore = {
      getAll: async () => ({}),
      put: async () => {},
      clear: () => new Promise<void>((r) => { finish = () => { cleared = true; r(); }; }),
    };
    const s = createSplitSaver<S>({ storage: spyLS(), key: 'k', store });
    const p = s.reset();
    expect(p).toBeInstanceOf(Promise);
    await Promise.resolve();
    expect(cleared).toBe(false);
    finish();
    await p;
    expect(cleared).toBe(true);
  });

  it('CL-41 a failed clear never rejects reset and is reported as onError clear', async () => {
    const codes: string[] = [];
    const store: ObjectStore = { getAll: async () => ({}), put: async () => {}, clear: async () => { throw new Error('locked'); } };
    const s = createSplitSaver<S>({ storage: spyLS(), key: 'k', store, onError: (c) => { codes.push(c); } });
    await expect(s.reset()).resolves.toBeUndefined();
    expect(codes).toEqual(['clear']);
  });

  it('CL-41 saving after a reset still works for the new state', async () => {
    const ls = spyLS();
    const { store, release } = deferredStore();
    release(true);
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store });
    s.save(st({ old: 'OLD' }));
    await s.reset();
    s.save(st({ fresh: 'NEW' }));
    await s.flush();
    expect(ls.sets.length).toBeGreaterThan(0);
    expect(ls.sets[ls.sets.length - 1]).not.toContain('OLD');
  });
});

describe('CL-41 PS-R3 onError reports a code only', () => {
  it('CL-41 a put failure reports put, then falls back to inline', async () => {
    const codes: string[] = [];
    const ls = spyLS();
    const { store, release } = deferredStore();
    release(false);
    const s = createSplitSaver<S>({ storage: ls, key: 'k', store, inlineMax: 1000, onError: (c) => { codes.push(c); } });
    s.save(st({ a: 'AAAA' }));
    await s.flush();
    expect(codes).toEqual(['put']);
    expect(ls.sets[ls.sets.length - 1]).toContain('AAAA');
  });

  it('CL-41 a setItem failure reports write and the saver does not throw', () => {
    const codes: string[] = [];
    const s = createSplitSaver<S>({ storage: { setItem: () => { throw new Error('QuotaExceeded secret-key-name'); } }, key: 'k', onError: (c) => { codes.push(c); } });
    expect(() => s.save(st({ a: 'A' }))).not.toThrow();
    expect(codes).toEqual(['write']);
  });

  it('CL-41 onError is called with exactly one argument, a plain code (no keys, bytes or errors)', async () => {
    const onError = jest.fn();
    const s = createSplitSaver<S>({ storage: { setItem: () => { throw new Error('x'); } }, key: 'secret-key', onError });
    s.save(st({ a: 'SECRET-BYTES' }));
    expect(onError).toHaveBeenCalled();
    for (const args of onError.mock.calls) {
      expect(args).toHaveLength(1);
      expect(['put', 'clear', 'write']).toContain(args[0]);
    }
  });

  it('CL-41 a throwing onError is ignored everywhere', async () => {
    const boom = (): never => { throw new Error('reporter broke'); };
    const failing: ObjectStore = { getAll: async () => ({}), put: async () => { throw new Error('q'); }, clear: async () => { throw new Error('c'); } };
    const s = createSplitSaver<S>({ storage: { setItem: () => { throw new Error('w'); } }, key: 'k', store: failing, onError: boom });
    expect(() => s.save(st({ a: 'A' }))).not.toThrow();
    await expect(s.flush()).resolves.toBeUndefined();
    await expect(s.reset()).resolves.toBeUndefined();
  });

  it('CL-41 no onError given: failures stay silent as before', async () => {
    const s = createSplitSaver<S>({ storage: { setItem: () => { throw new Error('w'); } }, key: 'k' });
    expect(() => s.save(st({ a: 'A' }))).not.toThrow();
    await expect(s.reset()).resolves.toBeUndefined();
  });
});

// A tiny IndexedDB whose connection can be closed or versioned away by the browser.
function lifeIdb() {
  const handles: Array<{ onclose?: () => void; onversionchange?: () => void; close: jest.Mock }> = [];
  const factory = {
    open() {
      const req: { result?: unknown; onsuccess?: () => void; onerror?: () => void; onupgradeneeded?: () => void; onblocked?: () => void } = {};
      setTimeout(() => {
        const table = new Map<string, string>();
        const db = {
          onclose: undefined as undefined | (() => void),
          onversionchange: undefined as undefined | (() => void),
          close: jest.fn(),
          createObjectStore: () => {},
          transaction: () => {
            const tx: { oncomplete?: () => void; objectStore: () => unknown } = {
              objectStore: () => ({ getAllKeys: () => ({ result: [...table.keys()] }), getAll: () => ({ result: [...table.values()] }), put: (v: string, k: string) => { table.set(k, v); }, clear: () => { table.clear(); } }),
            };
            setTimeout(() => tx.oncomplete?.(), 0);
            return tx;
          },
        };
        handles.push(db);
        req.result = db;
        req.onupgradeneeded?.();
        req.onsuccess?.();
      }, 0);
      return req;
    },
  };
  return { idb: factory as unknown as IDBFactory, handles };
}

describe('CL-41 PS-R4 idbObjects reopens after the connection goes away', () => {
  it('CL-41 onclose drops the cached connection so the next call opens again', async () => {
    const { idb, handles } = lifeIdb();
    const o = idbObjects({ name: 'n', idb })!;
    await o.getAll();
    expect(handles).toHaveLength(1);
    expect(typeof handles[0]!.onclose).toBe('function');
    handles[0]!.onclose!();
    await o.getAll();
    expect(handles).toHaveLength(2);
  });

  it('CL-41 onversionchange closes the db and drops it so the next call opens again', async () => {
    const { idb, handles } = lifeIdb();
    const o = idbObjects({ name: 'n', idb })!;
    await o.put([['a', 'A']]);
    expect(typeof handles[0]!.onversionchange).toBe('function');
    handles[0]!.onversionchange!();
    expect(handles[0]!.close).toHaveBeenCalled();
    await o.getAll();
    expect(handles).toHaveLength(2);
  });

  it('CL-41 without either event the one connection is reused', async () => {
    const { idb, handles } = lifeIdb();
    const o = idbObjects({ name: 'n', idb })!;
    await o.getAll();
    await o.put([['a', 'A']]);
    await o.clear();
    expect(handles).toHaveLength(1);
  });
});
