// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-24..CL-27: AvatarTile, AddTile, AddCard and DateStamp, moved over from the app they were first built in with the
// product words turned into props. Accessibility is the contract: label, visible word, 48 pt target, state in words.
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { AddCard, AddTile, AvatarTile, contrast, DateStamp, MIN_TARGET, paletteFor, THEME_NAMES, ThemeProvider } from '..';

const P = ThemeProvider as unknown as React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>;
const flat = (s: unknown) => (StyleSheet.flatten((typeof s === 'function' ? (s as (p: object) => unknown)({ pressed: false }) : s) as never) ?? {}) as Record<string, unknown>;

describe('CL-24 AvatarTile', () => {
  const base = { name: 'The Smiths', count: 3, avatars: ['Sam Smith', 'Jo Lee'], across: 3 };
  it.each([[false], [true]])('is a button whose name says the count and whether it is picked, 48 pt (easy view %s)', (easyView) => {
    const onPress = jest.fn();
    render(<P easyView={easyView}><AvatarTile {...base} picked={false} onPress={onPress} /></P>);
    const b = screen.getByRole('button', { name: 'The Smiths, 3 people, not picked' });
    expect(Number(flat(b.props.style).minHeight)).toBeGreaterThanOrEqual(MIN_TARGET);
    fireEvent.press(b);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('reads picked in its name and state, and one person in the singular', () => {
    render(<P><AvatarTile {...base} count={1} picked onPress={() => {}} /></P>);
    const b = screen.getByRole('button', { name: 'The Smiths, 1 person, picked' });
    expect(b.props.accessibilityState).toMatchObject({ selected: true });
  });
  it('shows the whole name and the count in words, and up to three initials', () => {
    render(<P><AvatarTile {...base} name="A very long name indeed" avatars={['Ann', 'Bo', 'Cy', 'Di']} picked={false} onPress={() => {}} /></P>);
    expect(screen.getByText('A very long name indeed')).toBeTruthy();
    expect(screen.getByTestId('tile-count')).toBeTruthy();
    expect(screen.getAllByText(/^[ABCD]$/)).toHaveLength(3);
  });
  it('takes its words from props so a product can use its own', () => {
    render(<P><AvatarTile {...base} unit={['member', 'members']} picked={false} onPress={() => {}} /></P>);
    expect(screen.getByRole('button', { name: 'The Smiths, 3 members, not picked' })).toBeTruthy();
  });
});

describe('CL-25 AddTile', () => {
  it('is a button named by its label, shows a visible word and is 48 pt', () => {
    const onPress = jest.fn();
    render(<P><AddTile label="Add items" onPress={onPress} /></P>);
    const b = screen.getByRole('button', { name: 'Add items' });
    expect(screen.getByText('Add')).toBeTruthy();
    expect(Number(flat(b.props.style).minHeight)).toBeGreaterThanOrEqual(MIN_TARGET);
    fireEvent.press(b);
    expect(onPress).toHaveBeenCalled();
  });
  it('takes a different visible word', () => {
    render(<P><AddTile label="Add people" text="Invite" onPress={() => {}} /></P>);
    expect(screen.getByText('Invite')).toBeTruthy();
  });
});

describe('CL-26 AddCard', () => {
  it('is one button: a tap anywhere on the card, its title visible, named by its label', () => {
    const onPress = jest.fn();
    render(<P><AddCard label="Add items" title="Add items" icon={{ sf: 'plus', md: 'add' }} onPress={onPress} testID="card">{null}</AddCard></P>);
    const b = screen.getByRole('button', { name: 'Add items' });
    expect(screen.getByText('Add items')).toBeTruthy();
    fireEvent.press(b);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('card')).toBeTruthy();
  });
  it.each([[false, 52], [true, 60]])('the disc is %s pt in easy view %s', (easyView, size) => {
    render(<P easyView={easyView}><AddCard label="Add" title="Add" icon={{ sf: 'plus', md: 'add' }} onPress={() => {}} /></P>);
    expect(flat(screen.getByTestId('add-card-disc').props.style).width).toBe(size);
  });
  it('shows what the product puts inside it', () => {
    render(<P><AddCard label="Add" title="Add" icon={{ sf: 'plus', md: 'add' }} onPress={() => {}} inSpot={<DateStamp date={new Date(2026, 10, 3)} />}>{null}</AddCard></P>);
    expect(screen.getByTestId('date-stamp', { includeHiddenElements: true })).toBeTruthy();
  });
  it('the card keeps no fixed height, so words are never cut at big text sizes', () => {
    render(<P><AddCard label="Add" title="Add" icon={{ sf: 'plus', md: 'add' }} onPress={() => {}} testID="card">{null}</AddCard></P>);
    expect(flat(screen.getByTestId('card').props.style).height).toBeUndefined();
  });
});

describe('CL-27 DateStamp', () => {
  it('shows the month then the day, and is hidden from screen readers and touches', () => {
    render(<P><DateStamp date={new Date(2026, 10, 3)} /></P>);
    const s = screen.getByTestId('date-stamp', { includeHiddenElements: true });
    expect(screen.getByText('Nov', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('3', { includeHiddenElements: true })).toBeTruthy();
    expect(s.props.pointerEvents).toBe('none');
    expect(s.props.accessibilityElementsHidden).toBe(true);
  });
  it('defaults to today', () => {
    render(<P><DateStamp /></P>);
    expect(screen.getByTestId('date-stamp', { includeHiddenElements: true })).toBeTruthy();
  });
});

describe('CL-28 tiles review round (UX-R1..R7)', () => {
  const sets = THEME_NAMES.flatMap((t) => [false, true].flatMap((dark) => [false, true].map((high) => ({ t, dark, high }))));
  it.each(sets.map((x) => [`${x.t} dark=${x.dark} high=${x.high}`, x] as const))('UX-R1 the AddTile edge is 3:1 on page and surface, %s', (_n, { t, dark, high }) => {
    render(<P theme={t} dark={dark} highContrast={high}><AddTile label="Add" onPress={() => {}} /></P>);
    const edge = String(flat(screen.getByRole('button').props.style).borderColor);
    const c = paletteFor('web', dark, t, high);
    expect(contrast(edge, c.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(edge, c.surface)).toBeGreaterThanOrEqual(3);
  });
  it.each(sets.map((x) => [`${x.t} dark=${x.dark} high=${x.high}`, x] as const))('UX-R2 the initial reads on its disc (4.5:1, 7:1 in high contrast), %s', (_n, { t, dark, high }) => {
    render(<P theme={t} dark={dark} highContrast={high}><AvatarTile name="N" count={1} avatars={['Ann']} across={3} picked={false} onPress={() => {}} /></P>);
    const dot = flat(screen.getByTestId('tile-dot').props.style);
    const ink = String(flat(screen.getByText('A').props.style).color);
    expect(contrast(ink, String(dot.backgroundColor))).toBeGreaterThanOrEqual(high ? 7 : 4.5);
  });
  it.each([[true], [false]])('UX-R3 the dot and tick borders match the ring behind them (picked %s)', (picked) => {
    render(<P><AvatarTile name="N" count={1} avatars={['Ann']} across={3} picked={picked} onPress={() => {}} /></P>);
    const c = paletteFor('web', false, 'paper', false);
    const want = picked ? c.accentSoft : c.bg;
    expect(flat(screen.getByTestId('tile-dot').props.style).borderColor).toBe(want);
    if (picked) expect(flat(screen.getByTestId('tile-tick').props.style).borderColor).toBe(want);
  });
  it('UX-R4 one state prop per platform, and the spoken name still ends in picked', () => {
    render(<P os="android"><AvatarTile name="N" count={1} avatars={['A']} across={3} picked onPress={() => {}} /></P>);
    const b = screen.getByRole('button');
    expect(b.props.accessibilityLabel).toMatch(/, picked$/);
    expect(b.props['aria-pressed']).toBeUndefined();
    expect(b.props.accessibilityState).toMatchObject({ selected: true });
  });
  it('UX-R5 AddTile has a ripple on Android and no opacity press there', () => {
    render(<P os="android"><AddTile label="Add" onPress={() => {}} /></P>);
    const pr = screen.UNSAFE_getAllByProps({ accessibilityLabel: 'Add' }).find((n) => typeof n.props.style === 'function')!;
    expect(pr.props.android_ripple).toBeTruthy();
    const style = (pr.props.style as (p: { pressed: boolean }) => unknown)({ pressed: true });
    expect(flat(style).opacity).toBe(1);
  });
  it('UX-R7 the stamp text uses the headline style and scales at most 1.5x', () => {
    render(<P><DateStamp date={new Date(2026, 10, 3)} /></P>);
    const t = screen.getByText('Nov', { includeHiddenElements: true });
    expect(t.props.maxFontSizeMultiplier).toBe(1.5);
    expect(flat(t.props.style).fontSize).toBe(17);
  });
});
