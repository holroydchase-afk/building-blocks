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
- At sign-out call `store.wipe()` FIRST (it moves the store on at once), then the session store's `clear()`. In that order a seal already in flight mints no new key and a stage in flight writes nothing and keeps nothing in memory. The other order can let a queued seal create a fresh key after sign-out.
- Call `sweep(liveUris)` at start-up, before any `stage`, to drop records no saved job points at (a sweep during a stage can delete the stage's new records), and `release(uris)` when a post publishes or is removed. Never change `scheme` without moving the saved uris: every uri with another scheme counts as not live, and a sweep would delete everything.
- `wipe()` is best effort: a browser may delay `deleteDatabase` while another tab has it open, and a failure is quiet. The real guarantee is that the session key is deleted, so what is left cannot be opened. Until it goes, the number of records and their sealed sizes (about the picture sizes) stay readable.
- Give each store on one origin its own `sealPrefix` (and `dbName`): sealed parts are bound to `<prefix><id>/<part>`.
- `verify` checks `display` and `thumb`, not `spec`: keep captions, places and other private data out of `spec`.

## Do and don't
**Do** pick a `scheme` that can never be a real address, and a database name of your own.
**Don't** hand it files that are not yet cleaned: `verify` is the last check, not the cleaning.
