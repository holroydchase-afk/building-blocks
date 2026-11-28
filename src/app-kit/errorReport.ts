// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Build an error report that cannot carry user content. Only the error's type and code leave the phone; the message
// (which may hold a caption, address or email) never does.
import { hasPhone, scrubPhone } from './scrub';

export interface ErrorReport { appVersion: string; os: string; screen: string; kind: string; code?: string }

const KIND = /^[A-Za-z][A-Za-z0-9_]{0,59}$/;
const SCREEN = /^[A-Za-z0-9_/[\]-]{1,40}$/;
const CODE = /^[A-Za-z0-9_]{1,20}$/;

/** `appVersion` and `os` come from the app (such as "ios 18.1"); `screen` is a route name, not a person's words. */
export function buildErrorReport(e: unknown, screen: string, ctx: { appVersion: string; os: string }): ErrorReport {
  const name = e instanceof Error ? e.name : '';
  const code = (e as { code?: unknown } | null)?.code;
  const r: ErrorReport = {
    appVersion: ctx.appVersion,
    os: ctx.os,
    screen: SCREEN.test(screen) ? scrubPhone(screen) : 'unknown',
    kind: KIND.test(name) && !hasPhone(name) ? name : 'Error',
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
