// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-21..CL-23: BackButton, MenuLine and Field's underline look, moved over from the app they were first built in.
// Accessibility is the contract: label, visible word and a 48 pt target (60 pt in Easy view for the back button).
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { BackButton, Field, MenuLine, MIN_TARGET, ThemeProvider } from '..';

const P = ThemeProvider as unknown as React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>;
const flat = (s: unknown) => (StyleSheet.flatten((typeof s === 'function' ? (s as (p: object) => unknown)({ pressed: false }) : s) as never) ?? {}) as Record<string, unknown>;

describe('CL-21 BackButton', () => {
  it.each([[false, MIN_TARGET], [true, 60]])('is a button named "Back to <place>", shows the place word, and is tall enough (easy view %s)', (easyView, min) => {
    const onPress = jest.fn();
    render(<P easyView={easyView}><BackButton to="Settings" onPress={onPress} /></P>);
    const b = screen.getByRole('button', { name: 'Back to Settings' });
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(Number(flat(b.props.style).minHeight)).toBeGreaterThanOrEqual(min);
    fireEvent.press(b);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('takes a spoken label that replaces the default', () => {
    render(<P><BackButton to="Home" label="Return to the start" onPress={() => {}} /></P>);
    expect(screen.getByRole('button', { name: 'Return to the start' })).toBeTruthy();
  });
});

describe('CL-22 MenuLine', () => {
  it('is a hairline rule inset to start where a MenuRow\'s words start, never full width', () => {
    render(<P><MenuLine /></P>);
    const s = flat(screen.getByTestId('menu-line').props.style);
    expect(s.height).toBe(StyleSheet.hairlineWidth);
    expect(Number(s.marginLeft)).toBeGreaterThan(0);
  });
});

describe('CL-23 Field underline', () => {
  const AnyField = Field as unknown as React.ComponentType<Record<string, unknown>>;
  it('underline draws no fill and one rule under the words', () => {
    render(<P><AnyField label="Note" underline testID="plain" /></P>);
    const plain = flat(screen.getByTestId('plain').props.style);
    expect(Number(plain.borderBottomWidth)).toBeGreaterThanOrEqual(1);
    expect(plain.backgroundColor === undefined || plain.backgroundColor === 'transparent').toBe(true);
  });
  it('still has its visible label and accessible name', () => {
    render(<P><AnyField label="Note" underline /></P>);
    expect(screen.getByLabelText('Note')).toBeTruthy();
    expect(screen.getByText('Note')).toBeTruthy();
  });
});

// ===== review round 1 (ux-reviewer UX-R1..R3, qa-tdd QA-R2): written first, red =====
import { contrast, iconSize, paletteFor, THEME_NAMES } from '..';

describe('UX-R1 the underline is the field\'s only edge, so it reads at 3:1 in every theme and mode', () => {
  const AnyField = Field as unknown as React.ComponentType<Record<string, unknown>>;
  const cases = THEME_NAMES.flatMap((theme) => [false, true].flatMap((dark) => [false, true].map((high) => ({ theme, dark, high }))));
  it.each(cases.map((x) => [`${x.theme} ${x.dark ? 'dark' : 'light'}${x.high ? ' high-contrast' : ''}`, x] as const))('%s', (_n, { theme, dark, high }) => {
    render(<P theme={theme} dark={dark} highContrast={high}><AnyField label="Note" underline testID="u" /></P>);
    const s = flat(screen.getByTestId('u').props.style);
    const c = paletteFor('ios', dark, theme, high);
    expect(Number(s.borderBottomWidth)).toBeGreaterThanOrEqual(1);
    expect(contrast(String(s.borderBottomColor), c.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(String(s.borderBottomColor), c.surface)).toBeGreaterThanOrEqual(3);
  });
});

describe('UX-R2 underline keeps its look on the web when focused or in error', () => {
  const AnyField = Field as unknown as React.ComponentType<Record<string, unknown>>;
  it('an error changes only the bottom edge, not the other three sides', () => {
    render(<P os="web"><AnyField label="Note" underline error="Required" testID="u" /></P>);
    const s = flat(screen.getByTestId('u').props.style);
    expect(s.borderTopWidth ?? 0).toBe(0);
    expect(s.borderLeftWidth ?? 0).toBe(0);
    expect(s.borderRightWidth ?? 0).toBe(0);
    expect(Number(s.borderBottomWidth)).toBeGreaterThanOrEqual(2);
    expect(s.borderBottomColor).toBe(paletteFor('web', false, 'paper', false).dangerText);
  });
  it('focus on the web thickens only the bottom edge, in the accent', () => {
    render(<P os="web"><AnyField label="Note" underline testID="u" /></P>);
    fireEvent(screen.getByTestId('u'), 'focus');
    const s = flat(screen.getByTestId('u').props.style);
    expect(s.borderTopWidth ?? 0).toBe(0);
    expect(Number(s.borderBottomWidth)).toBeGreaterThanOrEqual(2);
    expect(s.borderBottomColor).toBe(paletteFor('web', false, 'paper', false).accent);
  });
});

describe('UX-R3 MenuLine starts where the words start, also at large text', () => {
  it.each([1, 1.5, 2])('inset is the scaled 26 pt icon plus the 14 pt gap at font scale %s', (fontScale) => {
    const dims = require('react-native/Libraries/Utilities/useWindowDimensions') as { default: () => unknown };
    jest.spyOn(dims, 'default').mockReturnValue({ width: 390, height: 844, scale: 3, fontScale });
    render(<P><MenuLine /></P>);
    expect(flat(screen.getByTestId('menu-line').props.style).marginLeft).toBe(iconSize(26, fontScale) + 14);
  });
});

const spaced = StyleSheet.create({ top: { marginTop: 7 } });
describe('QA-R2 stronger pins', () => {
  it('BackButton ink uses the text colour, and style passes through', () => {
    render(<P><BackButton to="Home" ink style={spaced.top} onPress={() => {}} /></P>);
    const b = screen.getByRole('button', { name: 'Back to Home' });
    expect(flat(b.props.style).marginTop).toBe(7);
    expect(flat(screen.getByText('Home').props.style).color).toBe(paletteFor('ios', false, 'paper', false).ink);
  });
  it('Field underline looks the same on Android', () => {
    const AnyField = Field as unknown as React.ComponentType<Record<string, unknown>>;
    render(<P os="android"><AnyField label="Note" underline testID="u" /></P>);
    const s = flat(screen.getByTestId('u').props.style);
    expect(s.borderWidth ?? 0).toBe(0);
    expect(Number(s.borderBottomWidth)).toBeGreaterThanOrEqual(1);
  });
});
