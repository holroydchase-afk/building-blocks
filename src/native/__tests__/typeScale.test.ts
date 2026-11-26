// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-4, CL-5. Written first (red) by qa-tdd, 2026-11-26. Numbers from SPEC-TYPE as carried over into the layer.
import { MIN_TARGET, RADIUS, SPACE, TYPE } from '..';

const NAMES = ['largeTitle', 'title1', 'title2', 'title3', 'headline', 'body', 'callout', 'subheadline', 'footnote', 'caption1', 'caption2'];
/** [standard size, leading, easy size, leading] */
const TABLE: Record<string, [number, number, number, number]> = {
  largeTitle: [34, 41, 38, 46], title1: [28, 34, 32, 39], title2: [22, 28, 26, 32], title3: [20, 25, 24, 30],
  headline: [17, 22, 21, 26], body: [17, 22, 21, 26], callout: [16, 21, 20, 25], subheadline: [15, 20, 19, 24],
  footnote: [13, 18, 17, 22], caption1: [12, 16, 17, 22], caption2: [11, 13, 17, 22],
};

describe('CL-4 TYPE scale', () => {
  it('CL-4 has the 11 named styles in both sets, in order', () => {
    expect(Object.keys(TYPE.standard)).toEqual(NAMES);
    expect(Object.keys(TYPE.easy)).toEqual(NAMES);
  });

  it('CL-4 standard body is 17/22 and easy body is 21/26', () => {
    expect(TYPE.standard.body).toMatchObject({ fontSize: 17, lineHeight: 22 });
    expect(TYPE.easy.body).toMatchObject({ fontSize: 21, lineHeight: 26 });
  });

  it.each(NAMES)('CL-4 %s matches the table in standard and easy', (name) => {
    const [s, l, es, el] = TABLE[name]!;
    expect(TYPE.standard[name as keyof typeof TYPE.standard]).toMatchObject({ fontSize: s, lineHeight: l });
    expect(TYPE.easy[name as keyof typeof TYPE.easy]).toMatchObject({ fontSize: es, lineHeight: el });
  });

  it('CL-4 no easy style is under 17, and its leading is at least its size', () => {
    const bad = Object.entries(TYPE.easy).filter(([, s]) => s.fontSize < 17 || s.lineHeight < s.fontSize).map(([n]) => n);
    expect(bad).toEqual([]);
  });

  it('CL-4 only secondary styles (callout..caption2) are under 17 in standard', () => {
    const under = Object.entries(TYPE.standard).filter(([, s]) => s.fontSize < 17).map(([n]) => n);
    expect(under).toEqual(['callout', 'subheadline', 'footnote', 'caption1', 'caption2']);
  });
});

describe('CL-5 SPACE, RADIUS, MIN_TARGET', () => {
  it('CL-5 SPACE is a 4 pt grid: xs..xxl = 4, 8, 12, 16, 24, 32', () => {
    expect(SPACE).toEqual({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 });
  });

  it('CL-5 RADIUS has small 4, medium 12, photo 16 and pill 999', () => {
    expect(RADIUS).toEqual({ small: 4, medium: 12, photo: 16, pill: 999 });
  });

  it('CL-5 MIN_TARGET is 48', () => {
    expect(MIN_TARGET).toBe(48);
    const n: number = MIN_TARGET; // typed as a number
    expect(typeof n).toBe('number');
  });
});
