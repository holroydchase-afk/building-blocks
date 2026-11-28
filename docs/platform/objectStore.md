# objectStore

## What it is for
A browser caps storage at about 5 MB, so big write-once bytes go to IndexedDB and the small state stays in storage. `createSplitSaver` does the splitting and `idbObjects` is the store.

## Usage
```ts
import { createSplitSaver, idbObjects, objectsPresent } from '@holroyd/building-blocks/platform';

const store = idbObjects({ name: 'app.objects' });            // undefined when there is no IndexedDB
const saver = createSplitSaver<State>({ storage: localStorage, key: 'app.state', store });
saver.know(Object.keys(await store?.getAll() ?? {}));         // already stored: not written again
saver.save(state);                                            // state.objects is split off; call it on every change
await saver.flush();                                          // wait until the bytes have landed
await saver.reset();                                          // a fresh state: forgets the old one, clears the store
objectsPresent(state.objects, requiredKeys);                  // false if the browser wiped some bytes
```

## Rules
- `save`, `know`, `reset` and `flush` never throw or reject. A full storage or a failing store means the whole state is saved inline from then on.
- Bytes not yet in the store stay inline so a reload right after a change keeps them; a batch over `inlineMax` (default 1,000,000 characters) waits for the store and is never written inline.
- Each key is written once; later saves add only new keys. Keys may be any text, including `__proto__`.
- `idbObjects` opens lazily and its calls reject if the database cannot be opened; the saver turns that into inline saving. The store name defaults to `objects`.
- `objectsPresent` counts an empty value as missing and ignores inherited names.

- `reset` forgets the old state at once (a put still in flight never writes it back), removes the saved copy when the storage has `removeItem`, and resolves when the store clear is done. It never rejects.
- `onError(code)` gets `'put'`, `'clear'` or `'write'` only, never keys or bytes; a throwing `onError` is ignored.
- `idbObjects` reopens after the browser closes the connection or another tab upgrades the database. `store` must be the same for a given `name`, and the database version is fixed at 1.

## Warnings
- The contents are plain text and unencrypted. They stay on the device after sign-out unless `reset()` is called, so call it when someone signs out.
- `name` must be unique per app, or two apps share one database.
- Memory grows with the stored count: `getAll` reads every value at once.

## Do and don't
**Do** call `know` with the keys already in the store after a load, and `reset` before saving a brand new state.
**Don't** put values you need to change later in `objects`: they are write-once.
