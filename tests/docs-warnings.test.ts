// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-41 PS-R8 (and PS-R5, PS-R6, PS-R4 docs): the warnings the privacy-security review asked for must stay in the docs.
// Written first (red) by qa-tdd, 2026-11-28.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const doc = (p: string): string => readFileSync(join(__dirname, '..', p), 'utf8');

describe('CL-41 PS-R8 objectStore doc warnings', () => {
  const d = doc('docs/platform/objectStore.md');
  it('CL-41 says the contents are plain text and unencrypted', () => {
    expect(d).toMatch(/plain text/i);
    expect(d).toMatch(/unencrypted|not encrypted/i);
  });
  it('CL-41 says the bytes stay after sign-out unless reset() is called', () => {
    expect(d).toMatch(/sign-?out/i);
    expect(d).toMatch(/unless[^.\n]*reset\(\)/i);
  });
  it('CL-41 says name must be unique per app', () => {
    expect(d).toMatch(/`name`[^.\n]*unique[^.\n]*app/i);
  });
  it('CL-41 PS-R5 says memory grows with the stored count', () => {
    expect(d).toMatch(/memory[^.\n]*grow/i);
  });
  it('CL-41 PS-R4 says store must be the same for a name and the db version is fixed at 1', () => {
    expect(d).toMatch(/`store`[^.\n]*same[^.\n]*`name`/i);
    expect(d).toMatch(/version[^.\n]*(fixed|is)[^.\n]*\b1\b/i);
  });
});

describe('CL-41 PS-R8 state doc warnings', () => {
  const d = doc('docs/app-kit/state.md');
  it('CL-41 says prefs are for non-secret choices only', () => {
    expect(d).toMatch(/prefs[^.\n]*(non-secret|not secret)[^.\n]*only|only[^.\n]*non-secret[^.\n]*prefs/i);
  });
  it('CL-41 PS-R6 says keys are joined as-is, so a scope must not contain the separator', () => {
    expect(d).toMatch(/joined as-?is/i);
    expect(d).toMatch(/scope[^.\n]*separator|separator[^.\n]*scope/i);
  });
  it('CL-41 says a failed save is silent (no signal)', () => {
    expect(d).toMatch(/failed save[^.\n]*silent/i);
    expect(d).toMatch(/no signal/i);
  });
});
