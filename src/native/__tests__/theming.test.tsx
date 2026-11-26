// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-11, CL-12, CL-13, CL-18. Written first (red) by qa-tdd, 2026-11-26.
//
// ===== CONTRACT for the engineer (tests find things by these names) =====
// ThemeProvider props (all optional): theme: ThemeName = 'paper'; dark: boolean = false; easyView: boolean = false;
//   highContrast: boolean = false; os: 'ios' | 'android' | 'web' = 'ios'; fonts?: { regular: string; medium?: string; semibold: string }.
//   Without a ThemeProvider, components use the defaults above.
// IconProvider props: render: (icon: { sf: string; md: string }, opts: { color: string; size: number }) => ReactNode.
// Txt: variant?: TextStyleName = 'body'; tone?: 'ink' | 'muted' | 'accent' | 'danger'; emphasized?: boolean; role?: 'header'.
import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button, IconButton, IconProvider, paletteFor, ThemeProvider, TYPE, Txt } from '..';

type Pal = (os: string, dark: boolean, theme?: string, high?: boolean) => Record<string, string>;
const pal = paletteFor as unknown as Pal;
const flat = (s: unknown) => (StyleSheet.flatten((typeof s === 'function' ? (s as (p: object) => unknown)({ pressed: false }) : s) as never) ?? {}) as Record<string, unknown>;
const P = ThemeProvider as unknown as React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>;
const I = IconProvider as unknown as React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>;

describe('CL-11 fonts are configurable, system by default', () => {
  it('CL-11 by default a Txt uses the system font (no bundled family name)', () => {
    render(<P><Txt>Plain words</Txt></P>);
    const fam = flat(screen.getByText('Plain words').props.style).fontFamily;
    expect([undefined, 'System', 'system-ui']).toContain(fam);
  });

  it('CL-11 ThemeProvider fonts map sets regular and semibold families', () => {
    render(<P fonts={{ regular: 'Brand-Regular', semibold: 'Brand-SemiBold' }}>
      <Txt>Reading</Txt><Txt variant="title1" role="header">Heading</Txt>
    </P>);
    expect(flat(screen.getByText('Reading').props.style).fontFamily).toBe('Brand-Regular');
    expect(flat(screen.getByText('Heading').props.style).fontFamily).toBe('Brand-SemiBold');
  });

  it('CL-11 no font package is a dependency', () => {
    const pkg = require('../../../package.json') as { dependencies: Record<string, string> };
    const fonts = Object.keys(pkg.dependencies).filter((d) => /^@expo-google-fonts\//.test(d) || /atkinson|inter|roboto/i.test(d));
    expect(fonts).toEqual([]);
  });
});

describe('CL-12 icons are pluggable', () => {
  it('CL-12 IconProvider\'s renderer receives { sf, md } and the color and size', () => {
    const seen: unknown[] = [];
    render(<I render={(icon: unknown, opts: unknown) => { seen.push([icon, opts]); return <Text>glyph</Text>; }}>
      <Button label="Close" icon={{ sf: 'xmark', md: 'close' }} onPress={() => {}} />
    </I>);
    expect(screen.getByText('glyph')).toBeTruthy();
    expect(seen[0]).toMatchObject([{ sf: 'xmark', md: 'close' }, { color: expect.any(String), size: expect.any(Number) }]);
  });

  it('CL-12 the default on the web draws an accessible text glyph and the word stays visible', () => {
    render(<P os="web"><IconButton label="Close this" text="Close" icon={{ sf: 'xmark', md: 'close' }} onPress={() => {}} /></P>);
    expect(screen.getByText('Close')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close this' })).toBeTruthy();
  });

  it('CL-12 the default on iOS and Android renders without a provider (expo-symbols / Material name)', () => {
    for (const os of ['ios', 'android']) {
      const { unmount } = render(<P os={os}><Button label="Close" icon={{ sf: 'xmark', md: 'close' }} onPress={() => {}} /></P>);
      expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
      unmount();
    }
  });
});

describe('CL-13 Txt scales with the phone\'s text size and takes a TYPE style', () => {
  it('CL-13 never sets allowFontScaling to false', () => {
    render(<><Txt>Body</Txt><Txt variant="caption2" tone="muted">Small</Txt><Txt variant="largeTitle" role="header">Big</Txt></>);
    for (const w of ['Body', 'Small', 'Big']) expect({ w, off: screen.getByText(w).props.allowFontScaling === false }).toEqual({ w, off: false });
  });

  it('CL-13 the source never mentions allowFontScaling={false}', () => {
    const fs = require('fs') as typeof import('fs'); const path = require('path') as typeof import('path');
    const dir = path.join(__dirname, '..');
    const hits = fs.readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).filter((f) => /allowFontScaling=\{false\}|allowFontScaling: false/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
    expect(hits).toEqual([]);
    expect(fs.readdirSync(dir).filter((f) => /\.tsx$/.test(f)).length).toBeGreaterThan(0);
  });

  it('CL-13 the default variant is body, and a variant name takes that style\'s size, leading and weight', () => {
    render(<><Txt>Default</Txt><Txt variant="footnote">Note</Txt><Txt variant="title2" role="header">Section</Txt></>);
    expect(flat(screen.getByText('Default').props.style)).toMatchObject({ fontSize: TYPE.standard.body.fontSize, lineHeight: TYPE.standard.body.lineHeight });
    expect(flat(screen.getByText('Note').props.style)).toMatchObject({ fontSize: 13, lineHeight: 18 });
    expect(flat(screen.getByText('Section').props.style)).toMatchObject({ fontSize: 22, lineHeight: 28 });
  });

  it('CL-13 tone picks the palette color; headers are aria-level 1 for largeTitle and title1, else 2', () => {
    const c = pal('ios', false);
    render(<>
      <Txt tone="muted">Muted</Txt><Txt tone="accent">Accent</Txt><Txt tone="danger">Danger</Txt>
      <Txt variant="largeTitle" role="header">L</Txt><Txt variant="title1" role="header">T1</Txt><Txt variant="title2" role="header">T2</Txt>
    </>);
    expect(flat(screen.getByText('Muted').props.style).color).toBe(c.muted);
    expect(flat(screen.getByText('Accent').props.style).color).toBe(c.accent);
    expect(flat(screen.getByText('Danger').props.style).color).toBe(c.dangerText);
    expect([screen.getByText('L').props['aria-level'], screen.getByText('T1').props['aria-level'], screen.getByText('T2').props['aria-level']]).toEqual([1, 1, 2]);
  });
});

describe('CL-18 ThemeProvider switches theme, dark mode and Easy view; components re-render', () => {
  it('CL-18 theme and dark change the colors a Txt and a Button draw', () => {
    const Tree = ({ theme, dark }: { theme: string; dark: boolean }) => (
      <P theme={theme} dark={dark}><Txt tone="accent">Tinted</Txt><Button label="Go" onPress={() => {}} /></P>
    );
    const { rerender } = render(<Tree theme="paper" dark={false} />);
    expect(flat(screen.getByText('Tinted').props.style).color).toBe(pal('ios', false, 'paper').accent);
    expect(flat(screen.getByRole('button', { name: 'Go' }).props.style).backgroundColor).toBe(pal('ios', false, 'paper').accent);
    rerender(<Tree theme="avocado" dark={false} />);
    expect(flat(screen.getByText('Tinted').props.style).color).toBe(pal('ios', false, 'avocado').accent);
    rerender(<Tree theme="avocado" dark />);
    expect(flat(screen.getByText('Tinted').props.style).color).toBe(pal('ios', true, 'avocado').accent);
    expect(flat(screen.getByRole('button', { name: 'Go' }).props.style).backgroundColor).toBe(pal('ios', true, 'avocado').accent);
  });

  it('CL-18 highContrast gives the high-contrast set', () => {
    render(<P theme="kiwi" highContrast><Txt tone="muted">Quiet</Txt></P>);
    expect(flat(screen.getByText('Quiet').props.style).color).toBe(pal('ios', false, 'kiwi', true).muted);
  });

  it('CL-18 easyView swaps every style to the easy set (body 17 -> 21, button word, caption 12 -> 17)', () => {
    const Tree = ({ easy }: { easy: boolean }) => (
      <P easyView={easy}><Txt>Body</Txt><Txt variant="caption1">Cap</Txt><Button label="Send" onPress={() => {}} /></P>
    );
    const { rerender } = render(<Tree easy={false} />);
    expect(flat(screen.getByText('Body').props.style)).toMatchObject({ fontSize: 17, lineHeight: 22 });
    expect(flat(screen.getByText('Cap').props.style)).toMatchObject({ fontSize: 12 });
    expect(flat(screen.getByText('Send').props.style)).toMatchObject({ fontSize: TYPE.standard.headline.fontSize });
    rerender(<Tree easy />);
    expect(flat(screen.getByText('Body').props.style)).toMatchObject({ fontSize: 21, lineHeight: 26 });
    expect(flat(screen.getByText('Cap').props.style)).toMatchObject({ fontSize: 17, lineHeight: 22 });
    expect(flat(screen.getByText('Send').props.style)).toMatchObject({ fontSize: TYPE.easy.headline.fontSize });
  });
});
