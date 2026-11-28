// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// The last visit, kept on this device only: one key per person (`${keyPrefix}.${userId}`) holding an ISO time.
// Nothing here throws: a damaged value or a failing store reads as "no last visit".
import type { KV } from '../platform';

export interface LastSeen {
  /** The last visit, or null on a first open or when the stored value is empty, damaged or not a date. */
  load(userId: string): Promise<string | null>;
  save(userId: string, iso: string): Promise<void>;
}

export function createLastSeen(o: { kv: KV; keyPrefix: string }): LastSeen {
  const key = (u: string): string => `${o.keyPrefix}.${u}`;
  return {
    async load(userId) {
      try {
        const raw = await o.kv.getItem(key(userId));
        return typeof raw === 'string' && raw.length > 0 && raw.length <= 100 && !Number.isNaN(Date.parse(raw)) ? raw : null;
      } catch {
        return null;
      }
    },
    async save(userId, iso) {
      try { await o.kv.setItem(key(userId), iso); } catch { /* ignore: the next open just shows a little more */ }
    },
  };
}
