// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-30: the look of a picture tile: one soft shadow in light mode, none in dark, and the photo corner size.
import { photoShadow, RADIUS } from '..';

describe('CL-30 photoShadow', () => {
  it('is one soft warm shadow in light mode', () => {
    expect(photoShadow(false)).toEqual({ boxShadow: '0px 2px 12px rgba(30, 27, 23, 0.1)' });
  });
  it('is none in dark mode', () => {
    expect(photoShadow(true)).toBeNull();
  });
  it('takes its colour from the ink given, at 10%', () => {
    expect(photoShadow(false, '#000000')).toEqual({ boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.1)' });
    expect(photoShadow(false, '#FF8040')).toEqual({ boxShadow: '0px 2px 12px rgba(255, 128, 64, 0.1)' });
  });
  it('falls back to the default for an ink that is not #RRGGBB', () => {
    expect(photoShadow(false, 'red')).toEqual(photoShadow(false));
  });
  it('the photo corner is 16, between a card and a pill', () => {
    expect(RADIUS.photo).toBe(16);
  });
});
