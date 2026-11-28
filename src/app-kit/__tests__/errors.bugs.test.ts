// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// AK-10..AK-13 bugs found by the post-build boundary pass (qa-tdd, 2026-11-28). Each is red until the engineer fixes it.
import { buildErrorReport, loadFailedWords, safeMessage } from '..';

describe('AK-10 BUG-1 an email with a non-English letter in the name leaks whole', () => {
  it.each(['josé@example.com', 'müller@example.com', 'zoë.k@example.com'])('AK-10 BUG-1 %s is hidden', (e) => {
    expect(safeMessage(`failed for ${e}`)).not.toMatch(/jos|mü|zo|example/i);
  });
});
describe('AK-10 BUG-2 curly single quotes do not hide quoted text', () => {
  it('AK-10 BUG-2 text inside curly single quotes is replaced', () => {
    expect(safeMessage('failed: ‘Betty birthday party’ was cut')).not.toMatch(/Betty|birthday/);
  });
});
describe('AK-10 BUG-3 a path with a space in a folder name leaves part of the name', () => {
  it('AK-10 BUG-3 no folder name survives', () => {
    expect(safeMessage('cannot read /Users/Betty Smith/Pictures/x')).not.toMatch(/Betty|Smith/);
  });
});
describe('AK-11 BUG-4 a long plain route word makes the whole screen unknown', () => {
  it('AK-11 BUG-4 settings/notifications is a route template and is kept', () => {
    expect(buildErrorReport(new Error('x'), 'settings/notifications', { appVersion: '1.0.0', os: 'ios 18' }).screen).toBe('settings/notifications');
  });
});
describe('AK-13 BUG-5 a blank reassure leaves a leading space', () => {
  it('AK-13 BUG-5 a blank or missing reassure adds nothing and a null helper adds nothing', () => {
    expect(loadFailedWords('other', { reassure: '   ', helper: null }).line).toBe('Tap Try again.');
    expect(loadFailedWords('network', { reassure: '' }).line).toBe('Check your Wi-Fi or signal, then tap Try again.');
    expect(loadFailedWords('other', { reassure: '  Safe.  ', helper: ' Sam ' }).line).toBe('Safe. Tap Try again, or call Sam.');
  });
});
