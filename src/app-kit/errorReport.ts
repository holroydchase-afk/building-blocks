// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Build an error report that cannot carry user content. Only the error's type and code leave the phone; the message
// (which may hold a caption, address or email) never does.
import { hasPhone } from './scrub';

export interface ErrorReport { appVersion: string; os: string; screen: string; kind: string; code?: string }

const KIND = /^[A-Za-z][A-Za-z0-9_]{0,59}$/;
const SCREEN = /^[A-Za-z0-9_/[\]-]{1,40}$/;
const CODE = /^[A-Za-z0-9_]{1,20}$/;
const VERSION = /^[0-9A-Za-z.+-]{1,20}$/;
const OS = /^(ios|android|web)( [0-9.]{1,12})?$/;
/** A screen name carries a route template (`post/[id]`), never a resolved id: 6 or more digits, or 12 or more letters and digits in a row, is refused. */
const looksResolved = (s: string) => /\d{6,}/.test(s) || /[A-Za-z0-9]{12,}/.test(s) || /[0-9a-f]{8}-[0-9a-f]{4}/i.test(s) || (s.match(/\d/g)?.length ?? 0) >= 6;

/** `appVersion` and `os` come from the app (such as "ios 18.1"); `screen` is a route name, not a person's words. */
export function buildErrorReport(e: unknown, screen: string, ctx: { appVersion: string; os: string }): ErrorReport {
  let name = '';
  let code: unknown;
  try { name = e instanceof Error ? e.name : ''; code = (e as { code?: unknown } | null)?.code; } catch { /* a hostile error object */ }
  const r: ErrorReport = {
    appVersion: VERSION.test(ctx.appVersion) ? ctx.appVersion : 'unknown',
    os: OS.test(ctx.os) ? ctx.os : 'unknown',
    screen: SCREEN.test(screen) && !looksResolved(screen) && !hasPhone(screen) ? screen : 'unknown',
    kind: typeof name === 'string' && KIND.test(name) && !hasPhone(name) ? name : 'Error',
  };
  if (typeof code === 'string' && CODE.test(code) && !hasPhone(code)) r.code = code;
  return r;
}

/** "ios 18.1" from the platform name and version; any other platform is "web". */
export function describeOs(platform: string, version?: string | number | null): string {
  const os = platform === 'ios' || platform === 'android' ? platform : 'web';
  const v = String(version ?? '').replace(/[^0-9.]/g, '').slice(0, 12);
  return v ? `${os} ${v}` : os;
}
