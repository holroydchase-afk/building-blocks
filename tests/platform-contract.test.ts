// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-1, PL-12, PL-13, PL-14, PL-15 (docs/product/SPEC-PLATFORM-LAYER.md). Written first (red) by qa-tdd, 2026-11-26.
// Contract for the layer: src/platform/index.ts is the one entry and re-exports
//   KV, memoryKV, asyncStorageKV, webKV, webStorage, KeyStore, createSecureSessionStorage, secureSessionStorage,
//   HapticKind, haptic, readBytes, toBase64, fromBase64, randomBytes.
// Module files: kv, webStorage, storage (+ .web), secureSession (+ .web), haptics, bytes (+ .web), base64, random.
import fs from 'fs';
import path from 'path';

const ROOT = path.join(__dirname, '..');
const P = path.join(ROOT, 'src', 'platform');
const read = (...p: string[]) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const exists = (...p: string[]) => fs.existsSync(path.join(ROOT, ...p));
const walk = (dir: string, skip: (name: string) => boolean = () => false): string[] =>
  !fs.existsSync(dir) ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (skip(d.name)) return [];
    return d.isDirectory() ? walk(p, skip) : [p];
  });
const MODULES = ['kv', 'webStorage', 'storage', 'secureSession', 'haptics', 'bytes', 'base64', 'random'];
const TWINS = ['storage', 'secureSession', 'bytes'];
const PUBLIC = ['memoryKV', 'asyncStorageKV', 'webKV', 'webStorage', 'createSecureSessionStorage', 'secureSessionStorage', 'haptic', 'readBytes', 'toBase64', 'fromBase64', 'randomBytes'];

describe('PL-1 one public entry and web twins', () => {
  it('PL-1 package.json exports "./platform" with types, pointing at src/platform/index.ts', () => {
    const pkg = JSON.parse(read('package.json')) as { exports?: Record<string, unknown> };
    const e = pkg.exports?.['./platform'] as Record<string, string> | undefined;
    expect(e).toBeTruthy();
    expect(JSON.stringify(e)).toMatch(/src\/platform\/index\.ts/);
    expect(typeof e === 'object' && e !== null ? Boolean(e.types) : false).toBe(true);
  });

  it('PL-1 src/platform/index.ts exists and exports every public name', () => {
    expect(exists('src', 'platform', 'index.ts')).toBe(true);
    const api = require('../src/platform') as Record<string, unknown>;
    expect(PUBLIC.filter((n) => typeof api[n] !== 'function' && api[n] === undefined)).toEqual([]);
  });

  it.each(MODULES)('PL-1 module %s exists as src/platform/<name>.ts', (m) => {
    expect(exists('src', 'platform', `${m}.ts`)).toBe(true);
  });

  it.each(TWINS)('PL-1 native-only module %s has a .web.ts twin', (m) => {
    expect(exists('src', 'platform', `${m}.web.ts`)).toBe(true);
  });

  it('PL-1 the ./native entry is unchanged (still exported)', () => {
    const pkg = JSON.parse(read('package.json')) as { exports: Record<string, unknown> };
    expect(pkg.exports['./native']).toBeTruthy();
  });

  it('PL-1 nothing outside the platform layer deep-imports a platform file by path', () => {
    const files = walk(path.join(ROOT, 'src')).filter((f) => /\.(ts|tsx)$/.test(f) && !f.startsWith(P));
    const hits = files.filter((f) => /from ['"][^'"]*platform\/(?!index)[^'"]+['"]/.test(fs.readFileSync(f, 'utf8')));
    expect(hits.map((f) => path.relative(ROOT, f))).toEqual([]);
  });
});

describe('PL-12 no product words, headers', () => {
  const BAD = /hearth|grandparent|postcard|\bfamily\b|\bcircles?\b|\bphotos?\b|\bvideos?\b|supabase/i;
  it('PL-12 src/platform (not tests) and docs/platform contain none of the product words', () => {
    const files = [...walk(P, (n) => n === '__tests__'), ...walk(path.join(ROOT, 'docs', 'platform'))].filter((f) => /\.(ts|tsx|md|json)$/.test(f));
    expect(files.length).toBeGreaterThan(8);
    const hits = files.flatMap((f) => fs.readFileSync(f, 'utf8').split('\n').flatMap((l, i) => (BAD.test(l) ? [`${path.relative(ROOT, f)}:${i + 1}`] : [])));
    expect(hits).toEqual([]);
  });

  it('PL-12 every file under src/platform, tests included, starts with the MIT SPDX line then the copyright', () => {
    const files = walk(P).filter((f) => /\.(ts|tsx|js)$/.test(f));
    expect(files.length).toBeGreaterThan(8);
    const bad = files.filter((f) => {
      const [a, b] = fs.readFileSync(f, 'utf8').split('\n');
      return a !== '// SPDX-License-Identifier: MIT' || b !== '// Copyright (C) 2026 Chase Holroyd';
    });
    expect(bad.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it('PL-12 no AGPL text left in src/platform or docs/platform', () => {
    const hits = [...walk(P), ...walk(path.join(ROOT, 'docs', 'platform'))].filter((f) => /AGPL/i.test(fs.readFileSync(f, 'utf8')) && !f.includes('__tests__'));
    expect(hits).toEqual([]);
  });

  it('PL-12 every module states its contract in a header comment (the lines after the licence are comments)', () => {
    const missing = MODULES.filter((m) => !exists('src', 'platform', `${m}.ts`) || !/^\/\/ SPDX.*\n\/\/ Copyright.*\n\/\/ \S|^\/\/ SPDX.*\n\/\/ Copyright.*\n\/\*\*/.test(read('src', 'platform', `${m}.ts`)));
    expect(missing).toEqual([]);
  });
});

describe('PL-13 no network, no telemetry', () => {
  const sources = () => walk(P, (n) => n === '__tests__').filter((f) => /\.(ts|tsx)$/.test(f));
  it('PL-13 only bytes.ts and bytes.web.ts call fetch', () => {
    expect(sources().length).toBeGreaterThan(8);
    const hits = sources().filter((f) => /\bfetch\s*\(/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.basename(f)).sort();
    expect(hits).toEqual(['bytes.ts', 'bytes.web.ts']);
  });

  it('PL-13 no XMLHttpRequest, WebSocket, sendBeacon, EventSource, analytics or hard-coded http(s) URLs in the layer', () => {
    expect(sources().length).toBeGreaterThan(8);
    const hits = sources().filter((f) => /XMLHttpRequest|WebSocket|sendBeacon|EventSource|analytics|telemetry|https?:\/\/(?!www\.w3\.org)/i.test(fs.readFileSync(f, 'utf8').replace(/\/\/.*$/gm, '').replace(/'https?'|"https?"|startsWith\('http'\)/g, '')));
    expect(hits.map((f) => path.basename(f))).toEqual([]);
  });
});

describe('PL-14 dependencies', () => {
  const pkg = () => JSON.parse(read('package.json')) as { dependencies?: Record<string, string>; peerDependencies?: Record<string, string> };
  it.each(['@react-native-async-storage/async-storage', 'expo-secure-store', 'expo-haptics', 'expo-file-system', 'expo-crypto'])('PL-14 %s is a peerDependency and not a runtime dependency', (d) => {
    expect(pkg().peerDependencies?.[d]).toBeTruthy();
    expect(pkg().dependencies?.[d]).toBeUndefined();
  });

  it('PL-14 @noble/ciphers is a pinned dependency', () => {
    expect(pkg().dependencies?.['@noble/ciphers']).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('PL-14 the peers are also installed for tests (devDependencies)', () => {
    const dev = (JSON.parse(read('package.json')) as { devDependencies: Record<string, string> }).devDependencies;
    for (const d of ['@react-native-async-storage/async-storage', 'expo-secure-store', 'expo-haptics', 'expo-file-system', 'expo-crypto']) expect({ d, has: Boolean(dev[d]) }).toEqual({ d, has: true });
  });
});

describe('PL-15 docs per module', () => {
  const DOCS = ['kv', 'storage', 'webStorage', 'secureSession', 'haptics', 'bytes', 'base64', 'random'];
  for (const name of DOCS) {
    it(`PL-15 docs/platform/${name}.md says what it is for, shows usage, and has do and don't`, () => {
      expect(exists('docs', 'platform', `${name}.md`)).toBe(true);
      const md = exists('docs', 'platform', `${name}.md`) ? read('docs', 'platform', `${name}.md`) : '';
      for (const h of [/what it('s| is) for/i, /usage/i, /do\b.*don'?t|don'?t/i]) expect({ name, h: String(h), has: h.test(md) }).toEqual({ name, h: String(h), has: true });
      expect(md).toMatch(/```(ts|tsx)/);
    });
  }

  it('PL-15 docs/platform/secureSession.md has a security note (AES-256-GCM, key in the secure store, what it does not protect)', () => {
    const md = exists('docs', 'platform', 'secureSession.md') ? read('docs', 'platform', 'secureSession.md') : '';
    expect(md).toMatch(/security/i);
    expect(md).toMatch(/AES-256-GCM/);
    expect(md).toMatch(/secure ?store|keychain|keystore/i);
    expect(md).toMatch(/does not protect|doesn't protect|cannot protect|not protect/i);
  });
});
