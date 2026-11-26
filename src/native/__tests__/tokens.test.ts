// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-8, CL-9. Written first (red) by qa-tdd, 2026-11-26. Goldens are docs/design/tokens.json and docs/design/themes.css;
// regenerate with  UPDATE_TOKENS=1 npx jest tokens
import fs from 'fs';
import path from 'path';
import { portableTokens, themesCss, THEME_NAMES } from '..';

const DIR = path.join(__dirname, '..', '..', '..', 'docs', 'design');
const jsonFile = path.join(DIR, 'tokens.json');
const cssFile = path.join(DIR, 'themes.css');
const read = (f: string) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');

describe('CL-8 golden files', () => {
  it('CL-8 portableTokens() equals the committed docs/design/tokens.json', () => {
    const want = JSON.stringify(portableTokens(), null, 2) + '\n';
    if (process.env.UPDATE_TOKENS) { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(jsonFile, want); }
    expect(read(jsonFile)).toBe(want);
  });

  it('CL-8 themesCss() equals the committed docs/design/themes.css', () => {
    const want = themesCss();
    if (process.env.UPDATE_TOKENS) { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(cssFile, want); }
    expect(read(cssFile)).toBe(want);
  });

  it('CL-8 portableTokens() carries type (standard and easy), space, radius, target 48 and every theme light and dark', () => {
    const t = portableTokens() as unknown as { type: Record<string, Record<string, { fontSize: number }>>; space: Record<string, number>; radius: Record<string, number>; target: { min: number }; themes: Record<string, { light: object; dark: object }> };
    expect(t.type.standard?.body?.fontSize).toBe(17);
    expect(t.type.easy?.body?.fontSize).toBe(21);
    expect(t.space.lg).toBe(16);
    expect(t.radius.pill).toBe(999);
    expect(t.target.min).toBe(48);
    expect(Object.keys(t.themes)).toEqual([...THEME_NAMES]);
  });
});

describe('CL-9 themes.css is product-neutral', () => {
  it('CL-9 selects with data-theme for every theme, light, dark and high contrast; never a product attribute', () => {
    const css = themesCss();
    for (const n of THEME_NAMES) {
      expect(css).toContain(`[data-theme="${n}"]`);
      expect(css).toContain(`[data-theme="${n}"][data-mode="dark"]`);
      expect(css).toContain(`[data-theme="${n}"][data-contrast="more"]`);
    }
    expect(css).toMatch(/:root,\s*\[data-theme="paper"\]/);
    expect(css).not.toMatch(/data-[a-z]+-theme/);
  });

  it('CL-9 --font-body lists system-ui first', () => {
    expect(themesCss()).toMatch(/--font-body:\s*system-ui\b/);
  });
});
