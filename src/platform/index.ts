// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// The one public entry of the /platform layer: import from '@holroyd/building-blocks/platform', never a deep path.
export { memoryKV, type KV } from './kv';
export { webKV, webStorage } from './webStorage';
export { asyncStorageKV } from './storage';
export { createSecureSessionStorage, secureSessionStorage, type KeyStore } from './secureSession';
export { haptic, type HapticKind } from './haptics';
export { readBytes } from './bytes';
export { fromBase64, toBase64 } from './base64';
export { randomBytes } from './random';
export { createUploadStore, indexedDbUploadDb, type ByteSealer, type Prepared, type QueuedItem, type UploadDb, type UploadRecord, type UploadStore, type UploadStoreOptions, type UploadStoreReport } from './uploadStore';
export { createFileFolder, type FolderStore } from './fileFolder';
export { createBlobUrls, type BlobUrls } from './blobUrls';
export { createSaveToPhone, type MediaLibraryLike, type SaveResult } from './saveToPhone';
export { createSplitSaver, idbObjects, objectsPresent, type ObjectStore, type SplitSaver } from './objectStore';
