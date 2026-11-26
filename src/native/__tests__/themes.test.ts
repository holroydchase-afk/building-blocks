// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-6, CL-7. Written first (red) by qa-tdd, 2026-11-26. Contrast math follows the WCAG ratio; the 10 x 2 x 2 sets are
// checked one test each. Palette values come from tests/fixtures/fruit-palettes.json (the seed's golden copy).
import { paletteFor, THEME_NAMES } from '..';
import FRUIT from '../../../tests/fixtures/fruit-palettes.json';

type Colors = ReturnType<typeof paletteFor>;
type Mode = { page: string; fill: string; ink: string; muted: string; accent: string };
const FRUITS = FRUIT as unknown as Record<string, { light: Mode; dark: Mode }>;
const ORDER = ['paper', 'avocado', 'pomegranate', 'blood-orange', 'kiwi', 'fig', 'dragon-fruit', 'watermelon', 'beet', 'red-cabbage'];

/** WCAG 2.x contrast ratio of two #RRGGBB colors. */
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
const pal = (dark: boolean, theme: string, high = false): Colors =>
  (paletteFor as unknown as (os: string, dark: boolean, t: string, high: boolean) => Colors)('ios', dark, theme, high);
const KEYS = ['bg', 'surface', 'ink', 'muted', 'line', 'accent', 'accentInk', 'accentSoft', 'fill', 'safe', 'safeSoft', 'danger', 'onDanger', 'dangerText', 'scrim', 'photo', 'tabLine'];

describe('CL-6 themes: Paper plus nine fruits, light and dark, high-contrast set', () => {
  it('CL-6 THEME_NAMES is Paper then the nine fruits in order', () => {
    expect([...THEME_NAMES]).toEqual(ORDER);
  });

  it('CL-6 paletteFor(os, dark, theme, highContrast) returns every color role for all 40 sets', () => {
    for (const n of ORDER) for (const dark of [false, true]) for (const high of [false, true]) {
      expect({ n, dark, high, keys: Object.keys(pal(dark, n, high)).sort() }).toEqual({ n, dark, high, keys: [...KEYS].sort() });
    }
  });

  it('CL-6 Paper is the default and the same on ios, android and web', () => {
    for (const dark of [false, true]) {
      const d = (paletteFor as unknown as (os: string, dark: boolean) => Colors);
      expect(d('ios', dark)).toEqual(pal(dark, 'paper'));
      expect(d('android', dark)).toEqual(d('ios', dark));
      expect(d('web', dark)).toEqual(d('ios', dark));
    }
  });

  it('CL-6 Paper gives its exact light and dark values', () => {
    expect(pal(false, 'paper')).toMatchObject({ bg: '#F7F7F4', surface: '#FFFFFF', ink: '#1E1B17', muted: '#5C564E', line: '#E3DED4', fill: '#EFECE5', accent: '#AD371D', accentInk: '#FFFFFF' });
    expect(pal(true, 'paper')).toMatchObject({ bg: '#131210', surface: '#1C1A17', ink: '#F1EEE8', muted: '#B2ACA2', line: '#2E2B27', fill: '#24221E', accent: '#FF8A65', accentInk: '#000000' });
  });

  for (const n of ORDER.slice(1)) {
    for (const dark of [false, true]) {
      it(`CL-6 ${n} ${dark ? 'dark' : 'light'} gives the fixture's page, fill, ink, muted and accent`, () => {
        const j = FRUITS[n]![dark ? 'dark' : 'light'];
        const c = pal(dark, n);
        expect({ bg: c.bg, fill: c.fill, ink: c.ink, muted: c.muted, accent: c.accent }).toEqual({ bg: j.page, fill: j.fill, ink: j.ink, muted: j.muted, accent: j.accent });
      });
    }
  }

  it('CL-6 each high-contrast set keeps its page and has a stronger accent than the normal set', () => {
    for (const n of ORDER) for (const dark of [false, true]) {
      const [a, h] = [pal(dark, n), pal(dark, n, true)];
      expect({ n, dark, sameBg: h.bg === a.bg, stronger: contrast(h.accent, h.bg) > contrast(a.accent, a.bg) }).toEqual({ n, dark, sameBg: true, stronger: true });
    }
  });

  it('CL-6 an unknown theme name gives Paper', () => {
    expect(pal(false, 'ember')).toEqual(pal(false, 'paper'));
  });
});

describe('CL-7 contrast in every theme x light/dark x normal/high (40 sets)', () => {
  for (const n of ORDER) {
    for (const dark of [false, true]) {
      for (const high of [false, true]) {
        const label = `${n} ${dark ? 'dark' : 'light'}${high ? ' high' : ''}`;
        it(`CL-7 ${label}: ink 7:1 on bg (4.5:1 on surface, 7:1 for Paper); muted 4.5:1 on bg and fill; accent 4.5:1 on bg, fill, accentSoft`, () => {
          const c = pal(dark, n, high);
          const fails: string[] = [];
          const need = (fg: keyof Colors, on: keyof Colors, r: number) => {
            const v = contrast(c[fg], c[on]);
            if (!(v >= r)) fails.push(`${fg} ${c[fg]} on ${on} ${c[on]}: ${v.toFixed(2)} < ${r}`);
          };
          need('ink', 'bg', 7);
          need('ink', 'surface', n === 'paper' ? 7 : 4.5);
          need('muted', 'bg', high ? 7 : 4.5); need('muted', 'fill', 4.5);
          need('accent', 'bg', 4.5); need('accent', 'fill', 4.5); need('accent', 'accentSoft', 4.5);
          expect(fails).toEqual([]);
        });
      }
    }
  }
});
