# uploadStore

## What it is for
The web's byte store for uploads waiting to send. A browser has no file path that survives a restart, so each picked file is prepared (resized, cleaned of private data) BEFORE its upload job is saved, sealed with the session store's key (`sealBytes`) and kept in IndexedDB. The queue item's uri becomes `<scheme><stageId>/<index>`. On a phone `createUploadStore` returns `null`: `file://` uris already survive a restart.

## Usage (web)
```ts
import { createUploadStore, indexedDbUploadDb } from '@holroyd/building-blocks/platform';

const store = createUploadStore({
  db: indexedDbUploadDb('my-app.uploads'),
  sealer: secureSessionStorage,          // anything with sealBytes and openBytes
  report: (code) => log(code),           // 'upload_store_full' | 'upload_store_blocked', code only
  keeps: (item) => item.kind === 'image',// the rest pass through untouched
  verify: (bytes) => { /* throw if the bytes still carry private data */ },
  scheme: 'my-q:',                       // default 'q:'
});
const { items, durable } = await store.stage(picked, prepare, (done, total) => setProgress(done, total));
```
Also `open(uri)`, `has(uri)`, `memoryOnly(uri)`, `release(uris)`, `sweep(liveUris)` and `wipe()`.

## Rules the store keeps
- Nothing is ever written unsealed, and the store never reads or makes a key: when the sealer says `null` (no WebCrypto or key store), the post is kept in memory only and one code is reported.
- `verify` runs on every file before it is stored and again when it is opened, so a record from an old build or a tampered one fails closed.
- 150 MB cap by default (`capBytes`). Over it, blocked or full: that post stays in memory (`durable: false`); sharing is never refused.
- A sign-out during `stage` writes nothing and mints no new key: call `wipe()` at sign-out, together with the session store's `clear()`.
- Call `sweep(liveUris)` at start-up to drop records no saved job points at, and `release(uris)` when a post publishes or is removed.

## Do and don't
**Do** pick a `scheme` that can never be a real address, and a database name of your own.
**Don't** hand it files that are not yet cleaned: `verify` is the last check, not the cleaning.
