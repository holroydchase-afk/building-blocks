// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-41 PS-R7 (privacy-security review of the app-kit state pieces). Written first (red) by qa-tdd, 2026-11-28.
// load returns new Date(raw).toISOString() only for values that start with YYYY-MM-DD; save of a non-ISO string writes nothing.
import { memoryKV } from '../../platform';
import { createLastSeen } from '../lastSeen';

describe('CL-41 PS-R7 lastSeen accepts only ISO dates and normalizes them', () => {
  it('CL-41 a date-only value and an offset time come back as a normalized ISO string', async () => {
    const kv = memoryKV({ 'p.a': '2026-11-28', 'p.b': '2026-11-11T14:00:00+02:00', 'p.c': '2026-11-11T14:00:00.000Z' });
    const ls = createLastSeen({ kv, keyPrefix: 'p' });
    expect(await ls.load('a')).toBe('2026-11-28T00:00:00.000Z');
    expect(await ls.load('b')).toBe('2026-11-11T12:00:00.000Z');
    expect(await ls.load('c')).toBe('2026-11-11T14:00:00.000Z');
  });

  it('CL-41 values that Date.parse accepts but are not ISO dates read as no visit', async () => {
    for (const bad of ['1', '2026', '2026-11', '11/28/2026', 'Nov 28 2026', '  2026-11-28', '12345678']) {
      expect(await createLastSeen({ kv: memoryKV({ 'p.u': bad }), keyPrefix: 'p' }).load('u')).toBeNull();
    }
  });

  it('CL-41 an ISO-shaped but impossible date (month 13) reads as no visit', async () => {
    expect(await createLastSeen({ kv: memoryKV({ 'p.u': '2026-13-45' }), keyPrefix: 'p' }).load('u')).toBeNull();
  });

  it('CL-41 save of a non-ISO or invalid string writes nothing', async () => {
    const kv = memoryKV();
    const ls = createLastSeen({ kv, keyPrefix: 'p' });
    for (const bad of ['1', '2026', 'not a time', '', 'Nov 28 2026', '2026-13-45']) await ls.save('u', bad);
    expect(kv.dump()).toEqual({});
  });

  it('CL-41 save of a valid ISO string still writes it', async () => {
    const kv = memoryKV();
    await createLastSeen({ kv, keyPrefix: 'p' }).save('u', '2026-11-28T10:00:00.000Z');
    expect(kv.dump()).toEqual({ 'p.u': '2026-11-28T10:00:00.000Z' });
  });
});
