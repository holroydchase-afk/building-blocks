// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Browser storage that never throws. A browser with storage blocked (private window, strict cookie settings,
// some embeds) throws on window.localStorage itself; callers get undefined and keep values in memory for the visit.
export function webStorage(): Storage | undefined {
  try {
    const s = globalThis.localStorage;
    void s?.length; // some browsers only throw on first use
    return s ?? undefined;
  } catch {
    return undefined;
  }
}

/** A key/value store over localStorage that falls back to memory when storage is blocked or full. */
export function webKV() {
  // Memory is only a fallback: used when storage is blocked/throwing, or for keys whose write to storage failed.
  const mem = new Map<string, string>();
  const unsaved = new Set<string>();
  const get = (k: string) => {
    try {
      const st = webStorage();
      if (st) {
        const v = st.getItem(k);
        if (v != null) { unsaved.delete(k); return v; }
        return unsaved.has(k) ? mem.get(k) ?? null : null;
      }
    } catch { /* blocked */ }
    return mem.get(k) ?? null;
  };
  const set = (k: string, v: string) => {
    mem.set(k, v);
    try { const st = webStorage(); if (st) { st.setItem(k, v); unsaved.delete(k); } } catch { unsaved.add(k); }
  };
  const remove = (k: string) => { mem.delete(k); unsaved.delete(k); try { webStorage()?.removeItem(k); } catch { /* blocked */ } };
  return {
    getItem: async (k: string) => get(k),
    setItem: async (k: string, v: string) => set(k, v),
    removeItem: async (k: string) => remove(k),
  };
}
