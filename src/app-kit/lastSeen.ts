// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// The last visit, kept on this device only: one key per person (`${keyPrefix}.${userId}`) holding an ISO time.
// Nothing here throws: a damaged value or a failing store reads as "no last visit".
import type { KV } from '../platform';

export interface LastSeen {
  /** The last visit, or null on a first open or when the stored value is empty, damaged or not a date. */
  load(userId: string): Promise<string | null>;
  /** Writes the normalized ISO time; a value that is not an ISO date writes nothing. */
  save(userId: string, iso: string): Promise<void>;
}

const ISO_START = /^\d{4}-\d{2}-\d{2}/;

export function createLastSeen(o: { kv: KV; keyPrefix: string }): LastSeen {
  const normalize = (raw: string): string | null => {
    if (raw.length > 100 || !ISO_START.test(raw)) return null;
    const t = Date.parse(raw);
    return Number.isNaN(t) ? null : new Date(t).toISOString();
  };
  const key = (u: string): string => `${o.keyPrefix}.${u}`;
  return {
    async load(userId) {
      try {
        const raw = await o.kv.getItem(key(userId));
        return typeof raw === 'string' ? normalize(raw) : null;
      } catch {
        return null;
      }
    },
    async save(userId, iso) {
      try { const v = normalize(iso); if (v !== null) await o.kv.setItem(key(userId), v); } catch { /* ignore: the next open just shows a little more */ }
    },
  };
}
