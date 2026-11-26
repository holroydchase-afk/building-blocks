// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Key/value store contract (AsyncStorage-compatible) and an in-memory implementation for tests.
// Injected wherever storage is needed so tests can simulate an app kill with memoryKV(kv.dump()).
export interface KV {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export function memoryKV(seed: Record<string, string> = {}): KV & { dump(): Record<string, string> } {
  const m = new Map(Object.entries(seed));
  return {
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => { m.set(k, v); },
    removeItem: async (k) => { m.delete(k); },
    dump: () => Object.fromEntries(m),
  };
}
