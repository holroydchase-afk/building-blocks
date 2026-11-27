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
  it('underline draws no fill and a hairline rule; strongLine uses the stronger edge colour', () => {
    render(<P><AnyField label="Note" underline testID="plain" /><AnyField label="Strong" underline strongLine testID="strong" /></P>);
    const plain = flat(screen.getByTestId('plain').props.style);
    const strong = flat(screen.getByTestId('strong').props.style);
    expect(plain.borderBottomWidth).toBe(StyleSheet.hairlineWidth);
    expect(plain.backgroundColor === undefined || plain.backgroundColor === 'transparent').toBe(true);
    expect(strong.borderBottomColor).not.toBe(plain.borderBottomColor);
  });
  it('still has its visible label and accessible name', () => {
    render(<P><AnyField label="Note" underline /></P>);
    expect(screen.getByLabelText('Note')).toBeTruthy();
    expect(screen.getByText('Note')).toBeTruthy();
  });
});
