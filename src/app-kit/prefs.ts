// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Choices kept on this device: one JSON object per scope. The app supplies the key, the defaults and a sanitizer;
// this keeps the loading safe. Nothing here throws: anything unreadable gives the defaults.
import type { KV } from '../platform';

export interface PrefsOptions<T extends object, C = void> {
  kv: KV;
  key: (scope?: string) => string;
  defaults: (ctx: C) => T;
  /** Sees only a parsed object. Pick each field with pickBoolean / pickOneOf so a wrong type falls back. */
  sanitize: (raw: unknown, defaults: T, ctx: C) => T;
}

export interface Prefs<T extends object, C = void> {
  load(scope?: string, ctx?: C): Promise<T>;
  save(value: T, scope?: string): Promise<void>;
}

export function createPrefs<T extends object, C = void>(o: PrefsOptions<T, C>): Prefs<T, C> {
  return {
    async load(scope, ctx) {
      const d = o.defaults(ctx as C);
      try {
        const text = await o.kv.getItem(o.key(scope));
        if (!text) return d;
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return d;
        return o.sanitize(parsed, d, ctx as C);
      } catch {
        return d;
      }
    },
    async save(value, scope) {
      try { await o.kv.setItem(o.key(scope), JSON.stringify(value)); } catch { /* ignore */ }
    },
  };
}

/** A real boolean, else the fallback. */
export function pickBoolean(raw: unknown, fallback: boolean): boolean {
  return typeof raw === 'boolean' ? raw : fallback;
}

/** One of the allowed strings, else the fallback. */
export function pickOneOf<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  return typeof raw === 'string' ? (allowed.find((a) => a === raw) ?? fallback) : fallback;
}
