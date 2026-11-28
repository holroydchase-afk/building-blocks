// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// AK-10..AK-13: the error helpers an app needs, moved over from the app they were first built in with the product words
// turned into options: a message scrubber, an error report that cannot carry user content, an on-device problem log, and
// the words for a list that failed to load. Written first (red) by qa-tdd, 2026-11-28.
import { buildErrorReport, classifyError, createProblemLog, hasPhone, loadFailedWords, loadFailure, safeMessage, scrubPhone } from '..';

const EMAIL = 'june.example@example.com';
const URL_ = 'https://files.example.test/bucket/abc?X-Amz-Signature=deadbeef1234&X-Amz-Credential=KEYID';
const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJlLXNpZ25hdHVyZQ';
const DEK = 'c2VjcmV0a2V5c2VjcmV0a2V5c2VjcmV0a2V5MTIzNDU2';
const LEAKS = ['file:', '/var/mobile', 'IMG_0001', 'HEIC', 'Mia at the park', 'Mia', EMAIL, 'https:', 'files.example', 'X-Amz', 'deadbeef', 'KEYID', JWT, 'eyJ', DEK, 'c2VjcmV0', '0.5123', '0.4567', 'iPhone 15', 'Apple', 'DateTimeOriginal', '2026:10:18'];
const leaky = `file:///var/mobile/Containers/ABC/tmp/IMG_0001.HEIC "Mia at the park" Mia at the park for ${EMAIL} at ${URL_} token=${JWT} dek=${DEK} GPSLatitude 0.5123 GPSLongitude -0.4567 Make Apple Model iPhone 15 DateTimeOriginal 2026:10:18 12:01:02`;
const noLeaks = (t: string) => { for (const s of LEAKS) expect({ s, leaked: t.includes(s) }).toEqual({ s, leaked: false }); };

describe('AK-10 safeMessage and phone numbers', () => {
  it('removes urls, tokens, emails, paths, file names, quoted text, coordinates and photo metadata, and the words the app names', () => {
    noLeaks(safeMessage(leaky, ['Mia at the park']));
  });
  it('keeps ordinary short text and numbers', () => {
    expect(safeMessage('status 429 after 3 tries')).toBe('status 429 after 3 tries');
  });
  it('caps a message at 120 characters with an ellipsis', () => {
    const out = safeMessage('word '.repeat(80));
    expect(out.length).toBeLessThanOrEqual(120);
    expect(out.endsWith('…')).toBe(true);
  });
  it('a scrub word with regex characters is taken literally', () => {
    expect(safeMessage('hello (secret.*) world', ['(secret.*)'])).toBe('hello [caption] world');
  });
  it.each(['(304) 555-0100', '304-555-0100', '3045550100', '+13045550100'])('a phone number (%s) becomes [phone]', (n) => {
    const out = safeMessage(`Error sending to ${n}: no`);
    expect(out).toContain('[phone]');
    expect(out).not.toMatch(/555|0100|304/);
    expect(scrubPhone(`call ${n} now`)).toBe('call [phone] now');
    expect(hasPhone(`call ${n}`)).toBe(true);
  });
  it('hasPhone is stable across calls (no sticky regex state)', () => {
    expect([hasPhone('3045550100'), hasPhone('3045550100'), hasPhone('none')]).toEqual([true, true, false]);
  });
});

describe('AK-11 buildErrorReport', () => {
  const ctx = { appVersion: '1.2.3', os: 'ios 18.1' };
  it('carries only version, os, screen, the error type and its code', () => {
    const e = Object.assign(new TypeError('boom ' + EMAIL), { code: 'PGRST301' });
    expect(buildErrorReport(e, 'home/[id]', ctx)).toEqual({ appVersion: '1.2.3', os: 'ios 18.1', screen: 'home/[id]', kind: 'TypeError', code: 'PGRST301' });
  });
  it('never carries the message', () => {
    expect(JSON.stringify(buildErrorReport(new Error('secret caption'), 'home', ctx))).not.toMatch(/secret/);
  });
  it('an odd screen, kind or code becomes unknown, Error or is left out', () => {
    const e = Object.assign(new Error('x'), { name: 'bad name!', code: 'has spaces and is far too long to be a code' });
    expect(buildErrorReport(e, 'a b c', ctx)).toEqual({ appVersion: '1.2.3', os: 'ios 18.1', screen: 'unknown', kind: 'Error' });
  });
  it.each(['304-555-0100', '3045550100', '13045550100'])('never carries a phone number (%s) in the screen or code', (n) => {
    const r = buildErrorReport(Object.assign(new Error('x'), { code: n.replace(/\D/g, '') }), n, ctx);
    expect(JSON.stringify(r)).not.toMatch(/555|0100/);
  });
  it('a non-error value gives kind Error', () => {
    expect(buildErrorReport('text', 'home', ctx).kind).toBe('Error');
    expect(buildErrorReport(null, 'home', ctx).kind).toBe('Error');
  });
});

describe('AK-12 createProblemLog', () => {
  const make = (extra: Record<string, unknown> = {}) => createProblemLog({
    enabled: () => on, appVersion: '9.9.9', platform: () => 'ios 18', runtime: '58', updateId: () => 'abc-123-def-456', title: 'Problem details', ...extra });
  let on = true;
  beforeEach(() => { on = true; });
  it('keeps the last 20 problems, newest first, with when, where, code, retryable, a safe message and the app facts', () => {
    const log = make();
    for (let i = 1; i <= 25; i++) log.record(new Error(`step ${i}`), `test: step ${i}`);
    const list = log.list();
    expect(list).toHaveLength(20);
    expect(list[0]!.where).toBe('test: step 25');
    expect(list[0]).toEqual({ time: expect.stringMatching(/^\d{4}-\d\d-\d\dT/), where: 'test: step 25', code: 'Error', retryable: false, message: 'step 25', appVersion: '9.9.9', updateId: 'abc-123-def-456', platform: 'ios 18', runtime: '58' });
  });
  it('does nothing when it is off', () => {
    on = false;
    const log = make();
    log.record(new Error('x'), 'where');
    expect(log.list()).toEqual([]);
  });
  it('never keeps what the scrubber removes', () => {
    const log = make();
    log.record(new Error(leaky), 'photos: load', { scrub: ['Mia at the park'] });
    noLeaks(JSON.stringify(log.list()));
  });
  it('a where that is not plain becomes unknown, a code from the error is kept only when plain', () => {
    const log = make();
    log.record(Object.assign(new Error('x'), { code: 'PGRST301' }), 'has/../odd?chars');
    log.record(Object.assign(new Error('x'), { code: 'not a code!!' }), 'ok');
    expect(log.list().map((e) => [e.where, e.code])).toEqual([['ok', 'Error'], ['unknown', 'PGRST301']]);
  });
  it('the app decides the code and whether a retry makes sense', () => {
    const log = make({ classify: (e: unknown) => ({ code: (e as { c: string }).c, retryable: true }) });
    log.record({ c: 'NETWORK' }, 'x');
    expect(log.list()[0]).toMatchObject({ code: 'NETWORK', retryable: true });
  });
  it('a ref is kept, the list is copies, and clear and subscribe work', () => {
    const log = make();
    const seen: number[] = [];
    const off = log.subscribe(() => seen.push(log.list().length));
    log.record(new Error('a'), 'w', { ref: 'job-1' });
    log.list()[0]!.message = 'changed';
    expect(log.list()[0]!.message).toBe('a');
    expect(log.list()[0]!.ref).toBe('job-1');
    log.clear();
    off();
    log.record(new Error('b'), 'w');
    expect(seen).toEqual([1, 0]);
  });
  it('a broken updateId or classify never throws out of record', () => {
    const log = make({ updateId: () => { throw new Error('no'); }, classify: () => { throw new Error('no'); } });
    expect(() => log.record(new Error('x'), 'w')).not.toThrow();
  });
  it('text() is one plain block: the title, then key: value lines, ref left out', () => {
    const log = make();
    log.record(new Error('x'), 'w', { ref: 'job-1' });
    const t = log.text();
    expect(t.startsWith('Problem details\n')).toBe(true);
    expect(t).toContain('where: w');
    expect(t).toContain('app version: 9.9.9');
    expect(t).not.toContain('job-1');
    log.clear();
    expect(log.text()).toBe('Problem details\nproblems: none');
  });
  it('a long id from the runtime is dropped when it is not an id', () => {
    const log = make({ updateId: () => 'not an id!' });
    log.record(new Error('x'), 'w');
    expect(log.list()[0]!.updateId).toBe('none');
  });
});

describe('AK-13 classifyError, loadFailure and loadFailedWords', () => {
  it.each([
    [new TypeError('Network request failed'), 'NETWORK'], [new TypeError('x'), 'UNKNOWN'], [new Error('Network request failed'), 'NETWORK'], [new Error('Failed to fetch'), 'NETWORK'],
    [new Error('timed out'), 'NETWORK'], [new Error('Load failed'), 'NETWORK'], [new Error('The user aborted a request'), 'NETWORK'],
    [{ code: 'PGRST301', message: 'x' }, 'AUTH'], [{ code: 'PGRST302' }, 'AUTH'], [new Error('JWT expired'), 'AUTH'],
    [new Error('weird'), 'UNKNOWN'], ['text', 'UNKNOWN'], [null, 'UNKNOWN'], [undefined, 'UNKNOWN'],
  ])('%p is %s', (e, want) => { expect(classifyError(e)).toBe(want); });
  it('an error that already has a plain code keeps it', () => {
    expect(classifyError({ code: '23514', message: 'x' })).toBe('23514');
  });
  it('loadFailure is network or other', () => {
    expect(loadFailure(new TypeError('Failed to fetch'))).toBe('network');
    expect(loadFailure(new Error('weird'))).toBe('other');
  });
  it('words for no signal and for something else, with an optional name to call and an optional reassurance', () => {
    expect(loadFailedWords('network')).toEqual({ title: 'No signal right now', line: 'Check your Wi-Fi or signal, then tap Try again.' });
    expect(loadFailedWords('other')).toEqual({ title: 'Something went wrong', line: 'Tap Try again.' });
    expect(loadFailedWords('other', { helper: 'Sam' }).line).toBe('Tap Try again, or call Sam.');
    expect(loadFailedWords('network', { reassure: 'Your things are safe.' }).line).toBe('Your things are safe. Check your Wi-Fi or signal, then tap Try again.');
    expect(loadFailedWords('other', { helper: '  ' }).line).toBe('Tap Try again.');
  });
});

describe('AK-10..AK-13 review round (PS-R1..R9)', () => {
  const ms = (f: () => void) => { const t = Date.now(); f(); return Date.now() - t; };
  it.each([
    ['a long message', 'x '.repeat(100000)],
    ['dots and an extension', `${'a.'.repeat(30000)}jpg`],
    ['dashes and an extension', `${'a-'.repeat(30000)}.jpg`],
    ['an email start', `x@${'a-'.repeat(30000)}`],
    ['digits', '1'.repeat(50000)],
  ])('PS-R1 %s of 100k characters is cleaned in well under a second', (_n, raw) => {
    expect(ms(() => safeMessage(raw))).toBeLessThan(300);
  });
  it('PS-R1 a private word past the first 1000 characters never survives either', () => {
    const out = safeMessage(`${'y'.repeat(3000)} SECRETWORD`, ['SECRETWORD']);
    expect(out).not.toContain('SECRETWORD');
  });
  it.each([
    ['Authorization: Bearer abcdef123', 'abcdef123'], ['Bearer abc123def', 'abc123def'], ['password is hunter2', 'hunter2'], ['password: hunter2 extra', 'hunter2'],
  ])('PS-R2 %j leaves no secret', (raw, secret) => { expect(safeMessage(raw)).not.toContain(secret); });
  it.each([
    ['C:\\Users\\Betty\\Pictures\\x.png', 'Betty'], ['see www.example.com/photo?id=3', 'example'], ['\\\\server\\share\\Betty', 'Betty'],
  ])('PS-R3 %j leaves no path or host', (raw, leak) => { expect(safeMessage(raw)).not.toContain(leak); });
  it.each(['192.168.1.20', '10.0.0.1', '2001:db8::ff00:42:8329'])('PS-R4 the address %s is fully hidden', (ip) => {
    const out = safeMessage(`cannot reach ${ip} now`);
    expect(out).not.toMatch(/192|168|\.1\.20|10\.0|db8|8329/);
  });
  it.each([['555-1234', '555'], ['+44 7700 900123', '7700'], ['bob@localhost', 'bob']])('PS-R5 %j is hidden', (raw, leak) => {
    expect(safeMessage(raw)).not.toContain(leak);
  });
  it('PS-R6 an unterminated quote is cut, and a private word matches across changed whitespace and case', () => {
    expect(safeMessage('failed: "Betty\'s caption goes on')).not.toContain('caption');
    expect(safeMessage('Mia   at\nthe PARK was sent', ['Mia at the park'])).not.toMatch(/park/i);
  });
  it('nit: ordinary prose with Make or Model is kept; a metadata tag is still dropped', () => {
    expect(safeMessage('Make sure the network works')).toBe('Make sure the network works');
    expect(safeMessage('Model not found')).toBe('Model not found');
    expect(safeMessage('upload failed Make: Apple Model: iPhone')).not.toMatch(/Apple|iPhone/);
  });
  it.each([
    'post/8f3a1c2e-1111-2222-3333-444455556666', 'person/Betty-Smith-123456', '304/555/1234', 'a1b2c3d4e5f6a7b8',
  ])('PS-R7 the screen %s is not kept', (s) => {
    expect(buildErrorReport(new Error('x'), s, { appVersion: '1.0.0', os: 'ios 18' }).screen).toBe('unknown');
  });
  it('PS-R7 route templates are kept, and appVersion and os that are not plain are blanked', () => {
    expect(buildErrorReport(new Error('x'), 'post/[id]', { appVersion: '1.0.0', os: 'ios 18' }).screen).toBe('post/[id]');
    const r = buildErrorReport(new Error('x'), 'home', { appVersion: 'Betty phone 3045550100', os: 'ios 18 /Users/Betty' });
    expect(r.appVersion).toBe('unknown');
    expect(r.os).toBe('unknown');
  });
  it('PS-R8 a ref that is not a plain id is dropped', () => {
    const log = createProblemLog({ enabled: () => true, appVersion: '1', platform: () => 'ios', runtime: '58', title: 't' });
    log.record(new Error('x'), 'w', { ref: 'Betty at 123 Main Street' });
    log.record(new Error('x'), 'w', { ref: 'job-1' });
    expect(log.list().map((e) => e.ref)).toEqual(['job-1', undefined]);
  });
  it('PS-R9 nothing the log or report does can throw, even for hostile errors and listeners', () => {
    const log = createProblemLog({ enabled: () => { throw new Error('no'); }, appVersion: '1', platform: () => 'ios', runtime: '58', title: 't' });
    expect(() => log.record(new Error('x'), 'w')).not.toThrow();
    const on = createProblemLog({ enabled: () => true, appVersion: '1', platform: () => 'ios', runtime: '58', title: 't' });
    on.subscribe(() => { throw new Error('listener'); });
    expect(() => { on.record(new Error('x'), 'w'); on.clear(); }).not.toThrow();
    const evil = { get name(): string { throw new Error('x'); }, get code(): string { throw new Error('x'); }, get message(): string { throw new Error('x'); } };
    expect(() => buildErrorReport(evil, 'home', { appVersion: '1', os: 'ios' })).not.toThrow();
    expect(() => classifyError(evil)).not.toThrow();
    expect(() => on.record(evil, 'w')).not.toThrow();
    expect(classifyError({ message: { toString() { throw new Error('x'); } } })).toBe('UNKNOWN');
  });
  it('a plain object with a message (a database error) keeps its message in the log, and a coding TypeError is not "no signal"', () => {
    const log = createProblemLog({ enabled: () => true, appVersion: '1', platform: () => 'ios', runtime: '58', title: 't' });
    log.record({ message: 'relation missing', code: 'PGRST200' }, 'w');
    expect(log.list()[0]).toMatchObject({ message: 'relation missing', code: 'PGRST200' });
    expect(classifyError(new TypeError("Cannot read properties of undefined (reading 'x')"))).toBe('UNKNOWN');
    expect(classifyError(new TypeError('Network request failed'))).toBe('NETWORK');
    expect(classifyError(new TypeError('Failed to fetch'))).toBe('NETWORK');
  });
});
