// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Blob URLs held in memory: bytes a player or viewer needs as a URL, with nothing written to disk. On the phone use
// createFileFolder (a file uri works there); this is for the web, where the twin below is the real one.
export interface BlobUrls {
  /** A URL for the bytes, valid until it is removed, replaced or cleared. A name written again revokes its old URL. */
  write(name: string, bytes: Uint8Array): Promise<string>;
  remove(name: string): Promise<void>;
  clear(): Promise<void>;
}
export function createBlobUrls(_o: { type: string }): BlobUrls {
  throw new Error('createBlobUrls is for the web; on the phone use createFileFolder (a file uri works there)');
}
