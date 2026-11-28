// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Choosing what the app runs on at start: the fake, the real one, or a plain error. Nothing here throws.
const FAILED = 'The app could not start.';

export function chooseRuntime<D>(o: { fake: boolean; makeFake: () => D; makeReal: () => D | { error: string }; missing?: () => string | null }): D | { error: string } {
  try {
    if (o.fake) return o.makeFake();
    const gap = o.missing ? o.missing() : null;
    if (typeof gap === 'string') return { error: gap };
    return o.makeReal();
  } catch {
    return { error: FAILED };
  }
}

/** One function that runs the defined steps in order, goes on after a step fails, and never rejects. */
export function chainClears(...steps: Array<(() => Promise<void>) | undefined>): () => Promise<void> {
  return async () => {
    for (const step of steps) {
      if (typeof step !== 'function') continue;
      try { await step(); } catch { /* one failed clear must not stop the rest */ }
    }
  };
}
