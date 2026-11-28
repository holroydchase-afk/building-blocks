// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Design tokens as pure data and pure functions: this file imports nothing (no React, no React Native, no package), so
// docs, CSS builds and other products can use it. Seeded once from the studio's first app; fixes happen here.

export type OS = 'ios' | 'android' | 'web';

export interface Colors {
  bg: string; surface: string; ink: string; muted: string; line: string;
  accent: string; accentInk: string; accentSoft: string; fill: string;
  safe: string; safeSoft: string; danger: string; onDanger: string;
  /** Red words on the page or a sheet (a destructive choice); the system red in dark. */
  dangerText: string; scrim: string;
  /** The empty media tile: the fill. */
  photo: string;
  /** The tab bar's top line: `line` nudged toward the ink by the least step that is 3:1 against both the tab bar
   *  (surface) and the page (bg). Still a quiet grey; `line` itself stays subtle for other dividers. */
  tabLine: string;
}

// Paper (the default) plus nine fruit themes, each its own page, greys and accent. Body text is 7:1 or better; muted
// 4.5:1 on the page and fill; the accent 4.5:1 on the page, fills and its own soft tint, light and dark. Status
// colors are shared by every theme, except dark dangerText (#FF6961 on every fruit, Paper keeps #FF453A).
export type ThemeName = 'paper' | 'avocado' | 'pomegranate' | 'blood-orange' | 'kiwi' | 'fig' | 'dragon-fruit' | 'watermelon' | 'beet' | 'red-cabbage';
export const THEME_NAMES: readonly ThemeName[] = ['paper', 'avocado', 'pomegranate', 'blood-orange', 'kiwi', 'fig', 'dragon-fruit', 'watermelon', 'beet', 'red-cabbage'];

/** How far a soft tint (accentSoft, safeSoft) mixes its color into the page. */
export const SOFT = { light: 0.93, dark: 0.82 } as const;

const SAFE = { light: '#1C6E31', dark: '#7DD394' } as const;
const STATUS = {
  light: { safe: SAFE.light, danger: '#B3261E', dangerText: '#B3261E', onDanger: '#FFFFFF', scrim: 'rgba(0,0,0,0.4)' },
  dark: { safe: SAFE.dark, danger: '#F2B8B5', dangerText: '#FF453A', onDanger: '#601410', scrim: 'rgba(0,0,0,0.6)' },
};

/** Mix two #RRGGBB colors: t = 0 is a, 1 is b. */
export function mix(a: string, b: string, t: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return `#${[1, 3, 5].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** WCAG 2 contrast ratio of two opaque #RRGGBB colors. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, b2] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b2!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** A theme's own colors: page (bg), sheets (surface), words (ink, muted), hairlines (line), fills and the accent. */
interface Base { bg: string; surface: string; ink: string; muted: string; line: string; fill: string; accent: string }

type Given = Omit<Base, 'surface' | 'line'>;
/** surface = page and fill 50/50; line = page mixed toward ink 12% light, 16% dark. */
function fruit(light: Given, dark: Given): { light: Base; dark: Base } {
  const full = (g: Given, t: number): Base => ({ ...g, surface: mix(g.bg, g.fill, 0.5), line: mix(g.bg, g.ink, t) });
  return { light: full(light, 0.12), dark: full(dark, 0.16) };
}

const BASES: Record<ThemeName, { light: Base; dark: Base }> = {
  // Paper: an off-white page with white sheets and warm greys.
  paper: {
    light: { bg: '#F7F7F4', surface: '#FFFFFF', ink: '#1E1B17', muted: '#5C564E', line: '#E3DED4', fill: '#EFECE5', accent: '#AD371D' },
    dark: { bg: '#131210', surface: '#1C1A17', ink: '#F1EEE8', muted: '#B2ACA2', line: '#2E2B27', fill: '#24221E', accent: '#FF8A65' },
  },
  // Avocado: ripe skin gives the light ink and the dark page; flesh gives the fill and the light page.
  avocado: {
    light: { bg: '#F6F5E4', surface: mix('#F6F5E4', '#E7ECC6', 0.5), ink: '#1F1A1B', muted: '#4F4A42', line: '#DCDBCC', fill: '#E7ECC6', accent: '#2F5419' },
    dark: { bg: '#2A2426', surface: mix('#2A2426', '#3A3335', 0.5), ink: '#F3F1DA', muted: '#C2BDA8', line: '#4A4543', fill: '#3A3335', accent: '#7ED69B' },
  },
  pomegranate: fruit(
    { bg: '#FBF5E9', fill: '#F4E5CA', ink: '#9C1F2E', muted: '#9D5157', accent: '#B3122F' },
    { bg: '#1C0608', fill: '#2F090E', ink: '#F7EBD2', muted: '#B5A695', accent: '#F07C8A' },
  ),
  'blood-orange': fruit(
    { bg: '#FBF5EB', fill: '#F7DEC7', ink: '#6F1323', muted: '#91535A', accent: '#B4232F' },
    { bg: '#2A070D', fill: '#3D0A13', ink: '#F7EAD6', muted: '#BAA69A', accent: '#E46F2C' },
  ),
  kiwi: fruit(
    { bg: '#F9F8EC', fill: '#E6EEC0', ink: '#1E1912', muted: '#786750', accent: '#497522' },
    { bg: '#1F170D', fill: '#302314', ink: '#F3F1D8', muted: '#B3B09B', accent: '#8DBB3C' },
  ),
  fig: fruit(
    { bg: '#F6F1E5', fill: '#F0DBC9', ink: '#4A2A4C', muted: '#715C6E', accent: '#B12F45' },
    { bg: '#1E111E', fill: '#29172A', ink: '#ECDFC6', muted: '#AEA194', accent: '#DE9A73' },
  ),
  'dragon-fruit': fruit(
    { bg: '#FBF9F5', fill: '#F8DDE4', ink: '#1B1A1C', muted: '#5E5D5D', accent: '#B92A66' },
    { bg: '#262527', fill: '#363537', ink: '#F8F5EE', muted: '#B9B7B2', accent: '#F4AFC9' },
  ),
  watermelon: fruit(
    { bg: '#F4F7E9', fill: '#F4DFD5', ink: '#2A1C17', muted: '#536C4F', accent: '#B93340' },
    { bg: '#0A1409', fill: '#101F0F', ink: '#E7EDCF', muted: '#A5AC94', accent: '#F58C8C' },
  ),
  beet: fruit(
    { bg: '#FDF6F9', fill: '#F7DAE5', ink: '#7E2D4A', muted: '#865668', accent: '#AB3960' },
    { bg: '#210C13', fill: '#30111C', ink: '#F8E6EC', muted: '#B8A5AB', accent: '#E3779E' },
  ),
  'red-cabbage': fruit(
    { bg: '#F7F2F8', fill: '#E4D7E7', ink: '#47245A', muted: '#70587B', accent: '#6C3482' },
    { bg: '#170C1D', fill: '#211129', ink: '#EEE3F1', muted: '#AEA3B1', accent: '#A481B2' },
  ),
};

/** #FF453A is under 4.5:1 on some fruit darks (Avocado, Dragon fruit), so they use the higher-contrast system red. */
const DANGER_TEXT_DARK_FRUIT = '#FF6961';

/** The least nudge (0.01 steps) of `line` toward `ink` that is 3:1 against both `surface` and `page`. */
function edge(line: string, ink: string, surface: string, page: string): string {
  for (let i = 0; i <= 100; i++) {
    const m = mix(line, ink, i / 100);
    if (contrast(m, surface) >= 3 && contrast(m, page) >= 3) return m;
  }
  return ink;
}

function build(b: Base, dark: boolean, name: ThemeName): Colors {
  const mode = dark ? 'dark' : 'light';
  return {
    ...STATUS[mode],
    ...(dark && name !== 'paper' ? { dangerText: DANGER_TEXT_DARK_FRUIT } : {}),
    ...b,
    photo: b.fill,
    safeSoft: mix(SAFE[mode], b.bg, SOFT[mode]),
    accentInk: dark ? '#000000' : '#FFFFFF',
    accentSoft: mix(b.accent, b.bg, SOFT[mode]),
    tabLine: edge(b.line, b.ink, b.surface, b.bg),
  };
}

/** The least nudge of `from` toward `to` that reaches `ratio` against `against` (starting at `min`). */
function nudge(from: string, to: string, against: string, ratio: number, min = 0): string {
  for (let t = min; t < 1; t += 0.05) {
    const c = mix(from, to, t);
    if (contrast(c, against) >= ratio) return c;
  }
  return to;
}

// High-contrast set: same hues, pulled toward the ink. Secondary words reach 7:1, edges 4.5:1, the tap color a clear step up.
const highCache = new Map<Colors, Colors>();
function highContrastOf(c: Colors): Colors {
  const hit = highCache.get(c);
  if (hit) return hit;
  const mode = c.accentInk === '#000000' ? 'dark' : 'light';
  let accent = nudge(c.accent, c.ink, c.bg, 0, 0.3);
  for (let t = 0.3; contrast(c.accentInk, accent) < 7 && t < 1; t += 0.05) accent = mix(c.accent, c.ink, t);
  const line = nudge(c.line, c.ink, c.surface, 4.5);
  const out: Colors = {
    ...c,
    muted: nudge(c.muted, c.ink, c.bg, 7),
    line,
    tabLine: edge(line, c.ink, c.surface, c.bg),
    accent,
    accentSoft: mix(accent, c.bg, SOFT[mode]),
  };
  highCache.set(c, out);
  return out;
}

let palettes: Record<ThemeName, { light: Colors; dark: Colors }> | null = null;
function allPalettes() {
  palettes ??= Object.fromEntries(THEME_NAMES.map((n) => [n, { light: build(BASES[n].light, false, n), dark: build(BASES[n].dark, true, n) }])) as Record<ThemeName, { light: Colors; dark: Colors }>;
  return palettes;
}

/** The colors for one theme, mode and contrast set. Same on every OS (the argument stays so a platform can differ later).
 *  An unknown theme name gives Paper. `high` is the phone's Increase Contrast / High contrast text setting. */
export function paletteFor(_os: OS, dark: boolean, theme: ThemeName = 'paper', high = false): Colors {
  const all = allPalettes();
  const p = (Object.prototype.hasOwnProperty.call(all, theme) ? all[theme] : undefined) ?? all.paper;
  const base = dark ? p.dark : p.light;
  return high ? highContrastOf(base) : base;
}

export const MIN_TARGET = 48;

/** Tab and toolbar words grow with the phone's text size up to 1.5x, then stop. Body text has no cap. */
export const LABEL_SCALE_CAP = 1.5;

/** An icon grows with the phone's text size (never shrinks), up to the same cap as its word. */
export function iconSize(base: number, fontScale: number): number {
  return Math.round(base * Math.min(Math.max(fontScale, 1), LABEL_SCALE_CAP));
}

/** A bottom sheet closes on a drag down of 80 pt or a quick flick down. */
export function sheetShouldClose(dy: number, vy: number): boolean {
  return dy > 80 || (dy > 0 && vy > 0.8);
}

/** Gaps and padding, on a 4 pt grid. Related things sit closer (sm) than unrelated ones (lg, xl). */
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
/** Corners: small (checkbox, quiet field), medium (rows, cards, choices, notices, fields), photo (large media tiles),
 *  pill (capsules, chips, avatars). */
export const RADIUS = { small: 4, medium: 12, photo: 16, pill: 999 } as const;
/** One soft warm shadow under a picture tile, light mode only (none in dark). Put it on a wrapper around the tile, so the
 *  tile's own corners clip the picture and the shadow is not clipped with it. The colour is `ink` (#RRGGBB, default a
 *  warm near-black) at 10%, 2 pt down, 12 pt blur. `boxShadow` works on iPhone, Android and the web. */
export function photoShadow(dark: boolean, ink = '#1E1B17'): { boxShadow: string } | null {
  if (dark) return null;
  const m = /^#([0-9a-f]{6})$/i.exec(ink) ?? /^#([0-9a-f]{6})$/i.exec('#1E1B17');
  const n = parseInt(m![1]!, 16);
  return { boxShadow: `0px 2px 12px rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, 0.1)` };
}

/** The one exception: dialogs keep each phone's own corner (iOS alert 14 pt, Material 3 dialog 28 dp). */
export function dialogRadius(os: OS): number {
  return os === 'android' ? 28 : 14;
}

// Eleven text styles by name, at Apple's sizes and leading (iOS Dynamic Type "Large"). Standard is that default size;
// Easy view is two steps up, raised to 17 where Apple goes under. The phone's text size still multiplies both.
// A style never sets color (Txt's tone does). Titles and headline are semibold; every other style is regular.
export type TextStyleName = 'largeTitle' | 'title1' | 'title2' | 'title3' | 'headline' | 'body' | 'callout'
  | 'subheadline' | 'footnote' | 'caption1' | 'caption2';
export const TEXT_STYLES: readonly TextStyleName[] = ['largeTitle', 'title1', 'title2', 'title3', 'headline', 'body', 'callout', 'subheadline', 'footnote', 'caption1', 'caption2'];
export type FontWeightName = 'regular' | 'medium' | 'semibold';
export interface TextStyleSpec { weight: 'regular' | 'semibold'; fontSize: number; lineHeight: number }

/** [standard size, leading, easy size, leading, semibold]. */
const TYPE_TABLE: Record<TextStyleName, [number, number, number, number, boolean]> = {
  largeTitle: [34, 41, 38, 46, true],
  title1: [28, 34, 32, 39, true],
  title2: [22, 28, 26, 32, true],
  title3: [20, 25, 24, 30, true],
  headline: [17, 22, 21, 26, true],
  body: [17, 22, 21, 26, false],
  callout: [16, 21, 20, 25, false],
  subheadline: [15, 20, 19, 24, false],
  footnote: [13, 18, 17, 22, false],
  caption1: [12, 16, 17, 22, false],
  caption2: [11, 13, 17, 22, false],
};
function typeSet(easy: boolean): Record<TextStyleName, TextStyleSpec> {
  return Object.fromEntries(TEXT_STYLES.map((n) => {
    const [s, l, es, el, semi] = TYPE_TABLE[n];
    return [n, { weight: semi ? 'semibold' : 'regular', fontSize: easy ? es : s, lineHeight: easy ? el : l }];
  })) as Record<TextStyleName, TextStyleSpec>;
}
export const TYPE: { standard: Record<TextStyleName, TextStyleSpec>; easy: Record<TextStyleName, TextStyleSpec> } = {
  standard: typeSet(false),
  easy: typeSet(true),
};

/** Each studio color token's Material 3 role, so other products can map it straight in. */
export const MATERIAL_ROLES: Record<keyof Colors, string> = {
  bg: 'background', surface: 'surface-container-low', ink: 'on-surface', muted: 'on-surface-variant',
  line: 'outline-variant', tabLine: 'outline', fill: 'surface-container', photo: 'surface-container-high',
  accent: 'primary', accentInk: 'on-primary', accentSoft: 'primary-container',
  safe: 'success', safeSoft: 'success-container', danger: 'error', onDanger: 'on-error', dangerText: 'error-text',
  scrim: 'scrim',
};

/** The system font stack: the library never bundles or fetches a font. A product passes its own through ThemeProvider. */
export const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** The tokens as plain data, for docs/design/tokens.json. */
export function portableTokens() {
  return {
    $description: 'Studio design tokens, generated from src/native/tokens.ts. Do not edit by hand (UPDATE_TOKENS=1 npx jest tokens).',
    font: {
      stack: FONT_STACK,
      weight: { regular: 400, medium: 500, semibold: 600 },
      rules: 'Regular for reading; semibold for titles, buttons and the picked tab. No bold, light, italics or all caps. A product may pass its own font through ThemeProvider.',
    },
    type: { standard: { ...TYPE.standard }, easy: { ...TYPE.easy } },
    space: { ...SPACE },
    radius: { ...RADIUS, dialogIos: 14, dialogAndroid: 28 },
    target: { min: MIN_TARGET },
    color: { light: { ...paletteFor('web', false) }, dark: { ...paletteFor('web', true) } },
    roles: { ...MATERIAL_ROLES },
    themes: Object.fromEntries(THEME_NAMES.map((n) => [n, { light: { ...paletteFor('web', false, n) }, dark: { ...paletteFor('web', true, n) } }])),
  };
}

const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
function vars(c: Colors, indent: string): string {
  return (Object.keys(MATERIAL_ROLES) as (keyof Colors)[])
    .map((k) => `${indent}--${kebab(k)}: ${c[k]};\n${indent}--md-sys-color-${MATERIAL_ROLES[k]}: ${c[k]};`)
    .join('\n');
}

/** Paper and the nine fruit themes as CSS variables for any studio web product, written to docs/design/themes.css.
 *  Set data-theme on <html>; data-mode="dark"|"light" forces a mode, otherwise the device decides;
 *  data-contrast="more" gives the high-contrast set. */
export function themesCss(): string {
  const out: string[] = [
    '/* Studio themes: Paper (default) and nine fruits. Generated from src/native/tokens.ts in',
    '   holroydchase-afk/building-blocks (UPDATE_TOKENS=1 npx jest tokens). Do not edit by hand.',
    '   Use: <html data-theme="avocado">; add data-mode="dark" or "light" to force a mode (otherwise the',
    '   device decides) and data-contrast="more" for the high-contrast set. Each color is given twice: the studio',
    '   name (--accent) and its Material 3 role (--md-sys-color-primary). */',
    '',
    ':root {',
    `  --font-body: ${FONT_STACK};`,
    '}',
  ];
  THEME_NAMES.forEach((n: ThemeName) => {
    const sel = `[data-theme="${n}"]`;
    const root = n === 'paper' ? `:root, ${sel}` : sel;
    out.push('', `/* ${n[0]!.toUpperCase()}${n.slice(1)} */`);
    out.push(`${root} {\n  color-scheme: light;\n${vars(paletteFor('web', false, n), '  ')}\n}`);
    const darkSel = n === 'paper' ? `:root:not([data-mode="light"]), ${sel}:not([data-mode="light"])` : `${sel}:not([data-mode="light"])`;
    out.push(`@media (prefers-color-scheme: dark) {\n  ${darkSel} {\n    color-scheme: dark;\n${vars(paletteFor('web', true, n), '    ')}\n  }\n}`);
    out.push(`${sel}[data-mode="dark"] {\n  color-scheme: dark;\n${vars(paletteFor('web', true, n), '  ')}\n}`);
    out.push(`${sel}[data-contrast="more"] {\n${vars(paletteFor('web', false, n, true), '  ')}\n}`);
    out.push(`${sel}[data-contrast="more"][data-mode="dark"] {\n${vars(paletteFor('web', true, n, true), '  ')}\n}`);
  });
  return out.join('\n') + '\n';
}
