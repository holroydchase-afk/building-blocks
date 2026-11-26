// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-10 (docs/product/SPEC-PLATFORM-LAYER.md). Written first (red) by qa-tdd, 2026-11-26.
// Contract, src/platform/base64.ts (pure, no atob/btoa/Buffer):
//   toBase64(b: Uint8Array): string    standard alphabet, '=' padded
//   fromBase64(s: string): Uint8Array  accepts base64url (- and _), ignores whitespace and padding, throws Error('invalid base64') on any other character
import { fromBase64, toBase64 } from '../base64';

const seq = (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 37 + 11) & 0xff);

describe('PL-10 base64', () => {
  it.each(Array.from({ length: 65 }, (_, i) => i))('PL-10 round-trips length %i and matches Node\'s encoder', (n) => {
    const b = seq(n);
    const s = toBase64(b);
    expect(s).toBe(Buffer.from(b).toString('base64'));
    expect(Array.from(fromBase64(s))).toEqual(Array.from(b));
  });

  it('PL-10 all 256 byte values round-trip', () => {
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(Array.from(fromBase64(toBase64(all)))).toEqual(Array.from(all));
  });

  it('PL-10 accepts base64url input (- and _, no padding) as the same bytes', () => {
    const b = Uint8Array.from([0xfb, 0xff, 0xfe, 0x3e, 0x3f]);
    const url = Buffer.from(b).toString('base64url');
    expect(url).toMatch(/[-_]/);
    expect(Array.from(fromBase64(url))).toEqual(Array.from(b));
  });

  it('PL-10 ignores whitespace and missing padding', () => {
    expect(Array.from(fromBase64('AQID\n'))).toEqual([1, 2, 3]);
    expect(Array.from(fromBase64('AQ'))).toEqual([1]);
    expect(Array.from(fromBase64(' A Q I D '))).toEqual([1, 2, 3]);
  });

  it.each(['!', 'AQ*D', 'AQID$', 'é', 'AQ.D', 'AQID\u0000'])('PL-10 rejects invalid character in %j', (s) => {
    expect(() => fromBase64(s)).toThrow('invalid base64');
  });

  it('PL-10 empty in, empty out', () => {
    expect(toBase64(new Uint8Array(0))).toBe('');
    expect(fromBase64('')).toHaveLength(0);
  });
});
