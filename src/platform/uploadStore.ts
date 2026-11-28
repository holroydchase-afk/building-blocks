// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Phones keep `file://` uris that already survive a restart, so there is no byte store here (uploadStore.web.ts is the
// web one). The caller gets null and nothing about the queue changes.
import type { ByteSealer, Prepared, QueuedItem, UploadDb, UploadRecord, UploadStore, UploadStoreOptions, UploadStoreReport } from './uploadStoreTypes';

export type { ByteSealer, Prepared, QueuedItem, UploadDb, UploadRecord, UploadStore, UploadStoreOptions, UploadStoreReport };
export function createUploadStore<Item extends QueuedItem, P extends Prepared>(_o: UploadStoreOptions<Item>): UploadStore<Item, P> | null {
  return null;
}

/** The web's real database; on the phone there is none, so every call fails (nothing should call it). */
export function indexedDbUploadDb(_dbName?: string): UploadDb {
  const no = () => Promise.reject(new Error('no IndexedDB on the phone'));
  return { get: no, put: no, delete: no, keys: no, wipe: no };
}
