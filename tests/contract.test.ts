// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-1, CL-2, CL-3, CL-10, CL-19, CL-20 (docs/product/SPEC-NATIVE-LAYER.md). Written first (red) by qa-tdd, 2026-11-26.
// CL-1 note: "exit 0" of each script is proven by CI running them; here we pin that the scripts exist and CI runs all four.
import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const exists = (...p: string[]) => fs.existsSync(path.join(ROOT, ...p));
const walk = (dir: string, skip: (name: string) => boolean = () => false): string[] =>
  !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (skip(d.name)) return [];
    return d.isDirectory() ? walk(p, skip) : [p];
  });

/** Every public component the spec names; each needs stories and a docs page (CL-19). */
const COMPONENTS = ['Txt', 'Button', 'IconButton', 'Field', 'Choice', 'MenuRow', 'Card', 'GroupedSection', 'Screen', 'Loading', 'Notice', 'AlertDialog', 'BottomSheet'];
const PUBLIC_NAMES = ['ThemeProvider', 'IconProvider', 'TYPE', 'SPACE', 'RADIUS', 'MIN_TARGET', 'THEME_NAMES', 'paletteFor', 'portableTokens', 'themesCss', ...COMPONENTS];

describe('CL-1 scripts and CI', () => {
  it('CL-1 package.json has typecheck, lint, test and build-storybook scripts', () => {
    const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;
    for (const s of ['typecheck', 'lint', 'test', 'build-storybook']) expect({ s, has: typeof scripts[s] }).toEqual({ s, has: 'string' });
  });

  it('CL-1 .github/workflows/ci.yml runs typecheck, lint, test and build-storybook on pull_request', () => {
    expect(exists('.github', 'workflows', 'ci.yml')).toBe(true);
    const ci = exists('.github', 'workflows', 'ci.yml') ? read('.github', 'workflows', 'ci.yml') : '';
    expect(ci).toMatch(/pull_request/);
    for (const s of ['typecheck', 'lint', 'test', 'build-storybook']) expect({ s, runs: new RegExp(`npm (run )?${s}\\b`).test(ci) }).toEqual({ s, runs: true });
  });
});

describe('CL-2 one public entry', () => {
  it('CL-2 package.json exports "./native" with types, pointing at src/native/index.ts', () => {
    const pkg = JSON.parse(read('package.json')) as { exports?: Record<string, unknown> };
    const e = pkg.exports?.['./native'] as Record<string, string> | string | undefined;
    expect(e).toBeTruthy();
    const flat = JSON.stringify(e);
    expect(flat).toMatch(/src\/native\/index\.ts/);
    expect(typeof e === 'object' && e !== null ? Boolean(e.types) : false).toBe(true);
  });

  it('CL-2 src/native/index.ts exports every public name the spec lists', () => {
    const api = require('../src/native') as Record<string, unknown>;
    const missing = PUBLIC_NAMES.filter((n) => api[n] === undefined);
    expect(missing).toEqual([]);
  });

  it('CL-2 nothing outside src/native/__tests__ and stories deep-imports a native file by path from outside the layer', () => {
    const files = walk(path.join(ROOT, 'src')).filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes(`${path.sep}native${path.sep}`));
    const hits = files.filter((f) => /from ['"][^'"]*native\/(?!index)[^'"]+['"]/.test(fs.readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
    expect(exists('src', 'native', 'index.ts')).toBe(true);
  });
});

describe('CL-3 tokens are pure data', () => {
  it('CL-3 src/native/tokens.ts imports neither react nor react-native (nor any package)', () => {
    expect(exists('src', 'native', 'tokens.ts')).toBe(true);
    const src = exists('src', 'native', 'tokens.ts') ? read('src', 'native', 'tokens.ts') : 'import "react"';
    const imports = [...src.matchAll(/(?:from|import|require\()\s*['"]([^'"]+)['"]/g)].map((m) => m[1]!);
    expect(imports.filter((i) => !i.startsWith('.'))).toEqual([]);
  });
});

describe('CL-10 no product words', () => {
  const BAD = /hearth|grandparent|postcard|\bfamily\b|\bcircles?\b/i;
  it('CL-10 src/ (not tests), docs/components, docs/design, .storybook, tokens.json and themes.css contain none of the product words', () => {
    const files = [
      ...walk(path.join(ROOT, 'src'), (n) => n === '__tests__'),
      ...walk(path.join(ROOT, 'docs', 'components')),
      ...walk(path.join(ROOT, 'docs', 'design')),
      ...walk(path.join(ROOT, '.storybook')),
    ].filter((f) => /\.(ts|tsx|md|mdx|json|css|js)$/.test(f));
    expect(files.length).toBeGreaterThan(5); // the layer exists (red until the engineer ports it)
    const hits = files.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').flatMap((l, i) =>
      (BAD.test(l.replace(/font[-_. ]?family/gi, '')) ? [`${path.relative(ROOT, f)}:${i + 1}`] : [])));
    expect(hits).toEqual([]);
  });
});

describe('CL-19 stories and docs for every component', () => {
  const stories = walk(path.join(ROOT, 'src', 'native')).filter((f) => /\.stories\.tsx?$/.test(f));
  for (const name of COMPONENTS) {
    it(`CL-19 ${name} has a story file with Light, Dark and EasyView stories`, () => {
      const f = stories.find((p) => path.basename(p).startsWith(`${name}.stories.`));
      expect({ name, story: f ? path.relative(ROOT, f) : null }).not.toEqual({ name, story: null });
      const src = f ? fs.readFileSync(f, 'utf8') : '';
      for (const s of ['Light', 'Dark', 'EasyView']) expect({ name, s, has: new RegExp(`export const ${s}\\b`).test(src) }).toEqual({ name, s, has: true });
    });

    it(`CL-19 docs/components/${name}.md says what it is for, its props, do and don't, and an accessibility note`, () => {
      expect(exists('docs', 'components', `${name}.md`)).toBe(true);
      const md = exists('docs', 'components', `${name}.md`) ? read('docs', 'components', `${name}.md`) : '';
      for (const h of [/what it('s| is) for/i, /props/i, /do\b.*don'?t|don'?t/i, /accessibility/i]) expect({ name, h: String(h), has: h.test(md) }).toEqual({ name, h: String(h), has: true });
    });
  }
});

describe('CL-20 headers and NOTICE', () => {
  it('CL-20 every .ts, .tsx, .js, .mjs and .cjs source file under src, tests, .storybook starts with the SPDX line then the copyright', () => {
    const files = [...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'tests')), ...walk(path.join(ROOT, '.storybook'))].filter((f) => /\.(ts|tsx|js|mjs|cjs)$/.test(f));
    expect(files.length).toBeGreaterThan(10); // src/native exists
    const bad = files.filter((f) => {
      const [a, b] = fs.readFileSync(f, 'utf8').split('\n');
      return a !== '// SPDX-License-Identifier: MIT' || !/^\/\/ Copyright \(C\) 2026 Chase Holroyd$/.test(b ?? '');
    });
    expect(bad.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it('CL-20 NOTICE records the Hearth seed and its date', () => {
    expect(exists('NOTICE')).toBe(true);
    const n = exists('NOTICE') ? read('NOTICE') : '';
    expect(n).toMatch(/Hearth/);
    expect(n).toMatch(/2026-11-2\d/);
    expect(n).toMatch(/seed/i);
  });
});
