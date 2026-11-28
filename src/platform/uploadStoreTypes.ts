// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// The shape of the web upload byte store (uploadStore.web.ts), shared with the phone's no-op twin.

/** Codes the store reports (code only: no sizes, names or bytes). */
export type UploadStoreReport = 'upload_store_full' | 'upload_store_blocked';

/** A queued upload item: what the store needs to know is its uri, and the app's own fields travel along untouched. */
export interface QueuedItem { uri: string }
/** What preparing an item gives: the cleaned full-size bytes, the small bytes, and the app's own `spec` (JSON-safe). */
export interface Prepared { spec: unknown; display: Uint8Array; thumb: Uint8Array }

export interface UploadStore<Item extends QueuedItem = QueuedItem, P extends Prepared = Prepared> {
  /** Prepares and keeps the items the app says to keep, in order; the rest pass through. Throws what `verify` throws
   *  (nothing is written then), or `signed out` when a sign-out lands mid-way. `durable` false: kept in memory only. */
  stage(items: Item[], prepare: (item: Item) => Promise<P>, onProgress?: (done: number, total: number) => void): Promise<{ items: Item[]; durable: boolean }>;
  /** The kept bytes, or null when missing, unopenable or no longer clean. */
  open(uri: string): Promise<P | null>;
  has(uri: string): Promise<boolean>;
  /** True when the item is kept in memory only this visit (nothing saved; closing the browser would lose it). */
  memoryOnly(uri: string): boolean;
  release(uris: string[]): Promise<void>;
  /** Deletes every record no live uri points at. */
  sweep(liveUris: string[]): Promise<void>;
  /** Sign-out: the whole database and every memory copy go. */
  wipe(): Promise<void>;
}

/** What is stored per item: three sealed parts. */
export interface UploadRecord { v: number; spec: Uint8Array; display: Uint8Array; thumb: Uint8Array }
export interface UploadDb {
  get(key: string): Promise<UploadRecord | undefined>;
  put(key: string, rec: UploadRecord): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
  /** Deletes the whole database. */
  wipe(): Promise<void>;
}
export interface ByteSealer {
  sealBytes(name: string, bytes: Uint8Array): Promise<Uint8Array | null>;
  openBytes(name: string, sealed: Uint8Array): Promise<Uint8Array | null>;
}

export interface UploadStoreOptions<Item extends QueuedItem> {
  db: UploadDb;
  sealer: ByteSealer;
  /** One code only: no sizes, names or bytes. */
  report: (code: UploadStoreReport) => void;
  /** Sealed bytes allowed in the database (default 150 MB). */
  capBytes?: number;
  /** Which items are prepared and kept; the rest pass through untouched. */
  keeps: (item: Item) => boolean;
  /** Throws when the bytes still carry anything private; stage and open fail closed on it. */
  verify: (bytes: Uint8Array) => void;
  /** The start of a kept item's uri (default `q:`); pick one that cannot be a real address. */
  scheme?: string;
  /** The start of the name each sealed part is bound to (default `q.`). Give each store on one origin its own. */
  sealPrefix?: string;
  /** A fresh id for each stage (default crypto.randomUUID). */
  newId?: () => string;
}
