// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// What kind of error is this, and the words for a list that failed to load. The server's own words are never shown:
// they can carry SQL, table names or words a person would not use.

/** NETWORK: no signal or a timeout. AUTH: the sign-in is no longer good. A plain code the error already carries is kept
 *  (such as a database error code); anything else is UNKNOWN. */
export function classifyError(e: unknown): string {
  const msg = typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : '';
  const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code ?? '') : '';
  if (code === 'PGRST301' || code === 'PGRST302' || /jwt/i.test(msg)) return 'AUTH';
  if (e instanceof TypeError || /network request failed|failed to fetch|load failed|networkerror|timed? ?out|aborted/i.test(msg)) return 'NETWORK';
  if (/^[A-Za-z0-9_]{1,20}$/.test(code)) return code;
  return 'UNKNOWN';
}

export type LoadFailure = 'network' | 'other';

export function loadFailure(e: unknown): LoadFailure {
  return classifyError(e) === 'NETWORK' ? 'network' : 'other';
}

/** The title and line for a list that failed to load. Never the server's words, never a made-up contact: `helper` is the
 *  name of a real person to call, when there is one. `reassure` is a sentence that goes first ("Your things are safe."). */
export function loadFailedWords(kind: LoadFailure, opts: { helper?: string | null; reassure?: string } = {}): { title: string; line: string } {
  const safe = opts.reassure ? `${opts.reassure.trim()} ` : '';
  const who = opts.helper?.trim();
  if (kind === 'network') return { title: 'No signal right now', line: `${safe}Check your Wi-Fi or signal, then tap Try again.` };
  return { title: 'Something went wrong', line: `${safe}Tap Try again${who ? `, or call ${who}` : ''}.` };
}
