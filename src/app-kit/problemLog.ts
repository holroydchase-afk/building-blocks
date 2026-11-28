// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// An on-device problem log for the people building the app: the last 20 problems, in memory only (nothing is written to
// storage or sent anywhere). Turn it on only in builds you control, so the people who use the app never see it. Each
// message is made safe before it is kept: no urls, keys, tokens, emails, phone numbers, captions, file paths or
// picture metadata.
import { classifyError } from './errors';
import { safeMessage } from './scrub';

export interface ProblemEntry {
  time: string;
  where: string;
  code: string;
  retryable: boolean;
  message: string;
  appVersion: string;
  updateId: string;
  platform: string;
  /** The runtime or SDK version the app gives. */
  runtime: string;
  /** A job id, so a failed item can show its own entry. Not part of the copied text. */
  ref?: string;
}

export interface ProblemLogOptions {
  /** Read each time: the log records nothing while this is false. */
  enabled: () => boolean;
  appVersion: string;
  /** For example "ios 18.1" (see describeOs). */
  platform: () => string;
  runtime: string;
  /** The over-the-air update id, if the app has one; anything that is not an id reads "none". */
  updateId?: () => string | null | undefined;
  /** The app's own mapping from an error to a code and whether a retry makes sense. */
  classify?: (e: unknown) => { code: string; retryable: boolean };
  /** The first line of the copied text. */
  title: string;
}

const MAX = 20;
const WHERE = /^[A-Za-z0-9_ :/[\]-]{1,40}$/;
const CODE = /^[A-Za-z0-9_]{1,20}$/;
const ID = /^[0-9a-f-]{8,64}$/i;
const REF = /^[A-Za-z0-9_-]{1,40}$/;

/** The text of an error, a string, or a plain object's `message`. */
function messageOf(e: unknown): string {
  if (typeof e === 'string') return e;
  const m = (e as { message?: unknown } | null)?.message;
  return typeof m === 'string' ? m : '';
}

function errorName(e: unknown): string {
  const n = e instanceof Error ? e.name : '';
  return /^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(n) ? n : 'Error';
}

export function createProblemLog(o: ProblemLogOptions) {
  let log: ProblemEntry[] = [];
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((f) => { try { f(); } catch { /* a listener must not break the log */ } });

  function updateId(): string {
    try { const id = o.updateId?.(); return typeof id === 'string' && ID.test(id) ? id : 'none'; } catch { return 'none'; }
  }

  return {
    /** Never throws: the log must not cause a second problem. */
    record(e: unknown, where: string, opts: { scrub?: (string | null | undefined)[]; ref?: string } = {}): void {
      try {
        if (!o.enabled()) return;
        const own = (e as { code?: unknown } | null)?.code;
        const kind = classifyError(e);
        const c = o.classify ? o.classify(e) : { code: typeof own === 'string' && CODE.test(own) ? own : e instanceof Error ? errorName(e) : kind, retryable: kind === 'NETWORK' };
        const entry: ProblemEntry = {
          time: new Date().toISOString(),
          where: WHERE.test(where) ? where : 'unknown',
          code: CODE.test(c.code) ? c.code : 'Error',
          retryable: c.retryable,
          message: safeMessage(messageOf(e), opts.scrub),
          appVersion: o.appVersion,
          updateId: updateId(),
          platform: o.platform(),
          runtime: o.runtime,
        };
        if (opts.ref && REF.test(opts.ref)) entry.ref = opts.ref;
        log = [entry, ...log].slice(0, MAX);
        notify();
      } catch {
        // the log must never cause a second problem
      }
    },
    /** Newest first, as copies. */
    list: (): ProblemEntry[] => log.map((e) => ({ ...e })),
    clear(): void { log = []; notify(); },
    subscribe(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; },
    /** One plain-text block to copy: the title, then key: value lines. */
    text(list: ProblemEntry[] = log): string {
      const body = list.length ? list.map((e) => [
        `time: ${e.time}`, `where: ${e.where}`, `code: ${e.code}`, `retryable: ${e.retryable ? 'yes' : 'no'}`, `message: ${e.message || '(none)'}`,
        `app version: ${e.appVersion}`, `update id: ${e.updateId}`, `platform: ${e.platform}`, `runtime: ${e.runtime}`,
      ].join('\n')).join('\n\n') : 'problems: none';
      return `${o.title}\n${body}`;
    },
  };
}
