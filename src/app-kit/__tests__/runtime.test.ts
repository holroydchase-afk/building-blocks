// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-34 (docs/product/SPEC-APP-KIT-STATE.md). Written first (red) by qa-tdd, 2026-11-28.
// Contract, src/app-kit/runtime.ts:
//   chooseRuntime<D>({ fake: boolean; makeFake: () => D; makeReal: () => D | { error: string }; missing?: () => string | null }): D | { error: string }
//     fake -> makeFake(); else missing() gives a string -> { error: thatString } without calling makeReal; else makeReal().
//     Never throws: a throw from a maker (or missing) returns { error: 'The app could not start.' }.
//   chainClears(...steps: Array<(() => Promise<void>) | undefined>): () => Promise<void>
//     runs the defined steps in order, goes on after a step that rejects, never rejects itself.
import { chainClears, chooseRuntime } from '../runtime';

const FAIL = { error: 'The app could not start.' };
type D = { kind: string };

describe('CL-34 chooseRuntime', () => {
  it('CL-34 fake: builds the fake and never touches the real one or the missing check', () => {
    const makeReal = jest.fn(() => ({ kind: 'real' }) as D);
    const missing = jest.fn(() => 'no server');
    const fake: D = { kind: 'fake' };
    expect(chooseRuntime<D>({ fake: true, makeFake: () => fake, makeReal, missing })).toBe(fake);
    expect(makeReal).not.toHaveBeenCalled();
    expect(missing).not.toHaveBeenCalled();
  });

  it('CL-34 real with nothing missing: builds the real one and never the fake', () => {
    const makeFake = jest.fn(() => ({ kind: 'fake' }) as D);
    const real: D = { kind: 'real' };
    expect(chooseRuntime<D>({ fake: false, makeFake, makeReal: () => real, missing: () => null })).toBe(real);
    expect(chooseRuntime<D>({ fake: false, makeFake, makeReal: () => real })).toBe(real); // missing is optional
    expect(makeFake).not.toHaveBeenCalled();
  });

  it('CL-34 something missing: the error says what, and the real one is never built', () => {
    const makeReal = jest.fn(() => ({ kind: 'real' }) as D);
    expect(chooseRuntime<D>({ fake: false, makeFake: () => ({ kind: 'fake' }), makeReal, missing: () => 'The app is not set up yet.' })).toEqual({ error: 'The app is not set up yet.' });
    expect(makeReal).not.toHaveBeenCalled();
  });

  it('CL-34 an error the real maker returns is passed through unchanged', () => {
    expect(chooseRuntime<D>({ fake: false, makeFake: () => ({ kind: 'fake' }), makeReal: () => ({ error: 'bad key' }) })).toEqual({ error: 'bad key' });
  });

  it('CL-34 never throws: a maker that throws gives the plain error (real, fake, and the missing check)', () => {
    const boom = (): never => { throw new Error('secret detail that must not leak'); };
    expect(chooseRuntime<D>({ fake: false, makeFake: () => ({ kind: 'f' }), makeReal: boom })).toEqual(FAIL);
    expect(chooseRuntime<D>({ fake: true, makeFake: boom, makeReal: () => ({ kind: 'r' }) })).toEqual(FAIL);
    expect(chooseRuntime<D>({ fake: false, makeFake: () => ({ kind: 'f' }), makeReal: () => ({ kind: 'r' }), missing: boom })).toEqual(FAIL);
    // non-Error throws too
    expect(chooseRuntime<D>({ fake: false, makeFake: () => ({ kind: 'f' }), makeReal: () => { throw 'text'; } })).toEqual(FAIL);
    expect(chooseRuntime<D>({ fake: false, makeFake: () => ({ kind: 'f' }), makeReal: () => { throw null; } })).toEqual(FAIL);
  });

  it('CL-34 each maker runs at most once per call', () => {
    const makeReal = jest.fn(() => ({ kind: 'r' }) as D);
    const missing = jest.fn(() => null);
    chooseRuntime<D>({ fake: false, makeFake: () => ({ kind: 'f' }), makeReal, missing });
    expect(makeReal).toHaveBeenCalledTimes(1);
    expect(missing).toHaveBeenCalledTimes(1);
  });
});

describe('CL-35 chainClears', () => {
  it('CL-35 runs the defined steps in order, skipping undefined ones, one after the other', async () => {
    const log: string[] = [];
    const step = (n: string, ms: number) => async () => { log.push(`${n}:start`); await new Promise((r) => setTimeout(r, ms)); log.push(`${n}:end`); };
    await chainClears(step('a', 20), undefined, step('b', 0), undefined)();
    expect(log).toEqual(['a:start', 'a:end', 'b:start', 'b:end']);
  });

  it('CL-35 nothing to run (no steps, or all undefined) resolves', async () => {
    await expect(chainClears()()).resolves.toBe(0); // PS-R2: resolves to the number of failed steps
    await expect(chainClears(undefined, undefined)()).resolves.toBe(0);
  });

  it('CL-35 a step that rejects does not stop the later ones, and the chain never rejects', async () => {
    const ran: string[] = [];
    const clear = chainClears(
      async () => { ran.push('a'); throw new Error('a failed'); },
      async () => { ran.push('b'); },
      async () => { ran.push('c'); return Promise.reject('c failed'); }, // a non-Error rejection
      async () => { ran.push('d'); },
    );
    await expect(clear()).resolves.toBe(2); // PS-R2: a and c failed
    expect(ran).toEqual(['a', 'b', 'c', 'd']);
  });

  it('CL-35 a step that throws at once (not a rejected promise) is survived the same way', async () => {
    const ran: string[] = [];
    const sync = ((): Promise<void> => { throw new Error('sync'); });
    await expect(chainClears(sync, async () => { ran.push('after'); })()).resolves.toBe(1); // PS-R2
    expect(ran).toEqual(['after']);
  });

  it('CL-35 can be run again and runs every step again each time', async () => {
    const step = jest.fn(async () => {});
    const clear = chainClears(step, step);
    await clear();
    await clear();
    expect(step).toHaveBeenCalledTimes(4);
  });

  it('CL-35 hostile: a null or non-function entry is not called as one and does not break the chain', async () => {
    const ran: string[] = [];
    const clear = chainClears(null as never, 'x' as never, async () => { ran.push('ok'); });
    await expect(clear()).resolves.toBe(0); // PS-R2: skipped entries are not failures
    expect(ran).toEqual(['ok']);
  });
});
