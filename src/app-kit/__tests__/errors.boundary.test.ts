// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// AK-10..AK-13 post-build boundary tests (qa-tdd, 2026-11-28): the edges of the 120-character cap, the 20-entry log, the
// 40-character names, empty and odd input, and the spellings of private text the first round did not try.
import { buildErrorReport, classifyError, createProblemLog, describeOs, hasPhone, loadFailedWords, safeMessage } from '..';

const ctx = { appVersion: '1.0.0', os: 'ios 18' };
const mk = (extra: Record<string, unknown> = {}) => createProblemLog({ enabled: () => true, appVersion: '1', platform: () => 'ios', runtime: '58', title: 't', ...extra });

describe('AK-10 boundaries', () => {
  it('AK-10 empty, whitespace-only and non-string input give an empty or plain string and never throw', () => {
    expect(safeMessage('')).toBe('');
    expect(safeMessage('   \n\t ')).toBe('');
    expect(() => safeMessage(undefined as unknown as string)).not.toThrow();
    expect(() => safeMessage(null as unknown as string)).not.toThrow();
    expect(() => safeMessage(12345 as unknown as string)).not.toThrow();
  });
  it('AK-10 a message of exactly 120 characters is kept whole and 121 is cut to 120 with an ellipsis', () => {
    const w = (n: number) => 'ab '.repeat(Math.ceil(n / 3)).slice(0, n).trimEnd() + 'z';
    const s120 = w(119); // 120 chars
    expect(s120).toHaveLength(120);
    expect(safeMessage(s120)).toBe(s120);
    const s121 = `${s120}q`;
    const out = safeMessage(s121);
    expect(out).toHaveLength(120);
    expect(out.endsWith('…')).toBe(true);
  });
  it('AK-10 scrub lists with null, undefined, empty and blank entries change nothing', () => {
    expect(safeMessage('hello world', [null, undefined, '', '   '])).toBe('hello world');
  });
  it('AK-10 a private word is hidden in every case', () => {
    expect(safeMessage('sent MIA to Mia and mia', ['Mia'])).toBe('sent [caption] to [caption] and [caption]');
  });
  it('AK-10 a private word that sits across the 1000 character cut is not left half showing', () => {
    const out = safeMessage(`${'y '.repeat(499)}SECRETWORD`, ['SECRETWORD']);
    expect(out).not.toMatch(/SECRET|WORD/);
  });
  it('AK-10 a 20 character token is hidden and 19 plain letters are kept as a word', () => {
    expect(safeMessage('internationalization')).toBe('[hidden]');
    expect(safeMessage('abcdefghijklmnopqrst')).toBe('[hidden]');
    expect(safeMessage('abcdefghijklmnopqrs')).toBe('abcdefghijklmnopqrs');
  });
  it('AK-10 hasPhone and scrubPhone ignore a date, a version and a short number', () => {
    for (const s of ['2026-11-28', 'v1.2.3', 'status 500', 'port 8080', '1.5 seconds']) expect(hasPhone(s)).toBe(false);
  });
  it('AK-10 a 100 character run of spaces and a very long word are cleaned quickly', () => {
    const t = Date.now();
    safeMessage(' '.repeat(100000));
    safeMessage('a'.repeat(100000));
    expect(Date.now() - t).toBeLessThan(300);
  });
});

describe('AK-11 boundaries', () => {
  it('AK-11 os: web, android and a bare platform are kept; upper case and anything else is unknown', () => {
    for (const os of ['web', 'android 14', 'ios', 'ios 18.1.2']) expect(buildErrorReport(new Error('x'), 'home', { ...ctx, os }).os).toBe(os);
    for (const os of ['', 'IOS 18', 'ios  18', 'windows 11', 'ios 1234567890123']) expect(buildErrorReport(new Error('x'), 'home', { ...ctx, os }).os).toBe('unknown');
  });
  it('AK-11 appVersion of 20 characters is kept and 21 is unknown; empty is unknown', () => {
    expect(buildErrorReport(new Error('x'), 'home', { ...ctx, appVersion: '1.2.3-beta.4+build.99' }).appVersion).toBe('unknown');
    expect(buildErrorReport(new Error('x'), 'home', { ...ctx, appVersion: '1.2.3-beta.4+build.9' }).appVersion).toBe('1.2.3-beta.4+build.9');
    expect(buildErrorReport(new Error('x'), 'home', { ...ctx, appVersion: '' }).appVersion).toBe('unknown');
  });
  it('AK-11 a screen of 40 characters is kept and 41 is unknown (39 plus one, then two), and an empty screen is unknown', () => {
    const ok = 'a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t'; // 39
    expect(buildErrorReport(new Error('x'), ok + '/', ctx).screen).toBe(ok + '/');
    expect(buildErrorReport(new Error('x'), ok + '/x', ctx).screen).toBe('unknown');
    expect(buildErrorReport(new Error('x'), '', ctx).screen).toBe('unknown');
  });
  it('AK-11 a code of 20 characters is kept, 21 is left out, and a numeric code is left out', () => {
    expect(buildErrorReport(Object.assign(new Error('x'), { code: 'A'.repeat(20) }), 'home', ctx).code).toBe('A'.repeat(20));
    expect(buildErrorReport(Object.assign(new Error('x'), { code: 'A'.repeat(21) }), 'home', ctx).code).toBeUndefined();
    expect(buildErrorReport(Object.assign(new Error('x'), { code: 500 }), 'home', ctx)).not.toHaveProperty('code');
  });
  it('AK-11 describeOs: known platforms keep their name, anything else is web, and the version is cleaned and cut', () => {
    expect(describeOs('ios', '18.1')).toBe('ios 18.1');
    expect(describeOs('android', 14)).toBe('android 14');
    expect(describeOs('windows', '11')).toBe('web 11');
    expect(describeOs('ios')).toBe('ios');
    expect(describeOs('ios', null)).toBe('ios');
    expect(describeOs('ios', 'v18.1-beta')).toBe('ios 18.1');
    expect(describeOs('ios', '1.2.3.4.5.6.7.8.9.0').length).toBeLessThanOrEqual('ios '.length + 12);
    expect(describeOs('ios', 0)).toBe('ios 0');
  });
});

describe('AK-12 boundaries', () => {
  it('AK-12 exactly 20 problems are all kept and the 21st drops the oldest', () => {
    const log = mk();
    for (let i = 1; i <= 20; i++) log.record(new Error(`m${i}`), 'w');
    expect(log.list()).toHaveLength(20);
    expect(log.list()[19]!.message).toBe('m1');
    log.record(new Error('m21'), 'w');
    expect(log.list()).toHaveLength(20);
    expect(log.list()[19]!.message).toBe('m2');
  });
  it('AK-12 a where of 40 characters is kept, 41 is unknown, and empty is unknown', () => {
    const log = mk();
    log.record(new Error('x'), 'a'.repeat(40));
    log.record(new Error('x'), 'a'.repeat(41));
    log.record(new Error('x'), '');
    expect(log.list().map((e) => e.where)).toEqual(['unknown', 'unknown', 'a'.repeat(40)]);
  });
  it('AK-12 a network error is retryable by default, and a plain error is not', () => {
    const log = mk();
    log.record(new TypeError('Network request failed'), 'w');
    log.record(new Error('weird'), 'w');
    expect(log.list().map((e) => e.retryable)).toEqual([false, true]);
  });
  it('AK-12 a thrown value that is a string or a plain object with no message is recorded without a message', () => {
    const log = mk();
    log.record('just text 3045550100', 'w');
    log.record({}, 'w');
    log.record(null, 'w');
    const l = log.list();
    expect(l).toHaveLength(3);
    expect(l[2]!.message).toBe('just text [phone]');
    expect(l[0]!.message).toBe('');
    expect(log.text()).toContain('message: (none)');
  });
  it('AK-12 a custom classify that returns a code that is not plain is stored as Error', () => {
    const log = mk({ classify: () => ({ code: 'has spaces!', retryable: false }) });
    log.record(new Error('x'), 'w');
    expect(log.list()[0]!.code).toBe('Error');
  });
  it('AK-12 the log can be turned off and on while the app runs, and a copy of list() cannot change the log', () => {
    let on = true;
    const log = mk({ enabled: () => on });
    log.record(new Error('a'), 'w');
    on = false;
    log.record(new Error('b'), 'w');
    on = true;
    log.record(new Error('c'), 'w');
    expect(log.list().map((e) => e.message)).toEqual(['c', 'a']);
    log.list().length = 0;
    expect(log.list()).toHaveLength(2);
  });
  it('AK-12 text() with two entries separates them with a blank line, and a unsubscribed listener is not called', () => {
    const log = mk();
    log.record(new Error('a'), 'w');
    log.record(new Error('b'), 'w');
    expect(log.text().split('\n\n')).toHaveLength(2);
    let n = 0;
    const off = log.subscribe(() => { n += 1; });
    off();
    off();
    log.record(new Error('c'), 'w');
    expect(n).toBe(0);
  });
  it('AK-12 a throwing platform() never throws out of record', () => {
    const log = mk({ platform: () => { throw new Error('no'); } });
    expect(() => log.record(new Error('x'), 'w')).not.toThrow();
  });
});

describe('AK-13 boundaries', () => {
  it.each([
    [{ code: 500, message: 'x' }, '500'], [{ code: '' }, 'UNKNOWN'], [{ code: 'A'.repeat(20) }, 'A'.repeat(20)], [{ code: 'A'.repeat(21) }, 'UNKNOWN'],
    [{ code: 'bad code' }, 'UNKNOWN'], [new Error('Timeout'), 'NETWORK'], [new Error('request timed out'), 'NETWORK'], [new Error('jwt malformed'), 'AUTH'],
    [{ code: 'PGRST301', message: 'Network request failed' }, 'AUTH'], [{ message: 42 }, 'UNKNOWN'], [0, 'UNKNOWN'], [false, 'UNKNOWN'], [{ code: null }, 'UNKNOWN'],
  ])('AK-13 %p is %s', (e, want) => { expect(classifyError(e)).toBe(want); });
  it('AK-13 loadFailedWords for the network never names a helper', () => {
    expect(loadFailedWords('network', { helper: 'Sam' }).line).not.toContain('Sam');
  });
});
