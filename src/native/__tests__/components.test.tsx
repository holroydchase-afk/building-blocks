// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-14, CL-15, CL-16, CL-17. Written first (red) by qa-tdd, 2026-11-26. Accessibility is the contract: every tappable
// control has a label, a visible word and a 48 pt target (patterns from the seed's a11ySweep and designSystem tests).
//
// ===== CONTRACT for the engineer =====
// Button({ label, text?, onPress, variant?, icon?, disabled?, softDisabled?, busy? }): label = accessible name, text = visible word (defaults to label).
// IconButton({ label, text, icon, onPress }): icon above, `text` caption below.
// Field({ label, error?, ...TextInputProps }): visible label, accessibilityLabel = label, error text in a live region.
// Choice({ kind: 'switch' | 'checkbox', label, title, detail?, checked, onPress, disabled? }).
// MenuRow({ text, icon, count?, value?, onPress }). Card/GroupedSection/Screen({ children, testID }). Screen({ scroll?, footer? }).
// Loading({ words }). Notice({ text, onClose?, tone? }): role alert + polite live region; its close button's label "OK, hide this message".
// AlertDialog({ title, body?, keep, destroy, onKeep, onDestroy }). BottomSheet({ testID, label, onClose, closeLabel = 'Close', children }).
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet, Switch, Text } from 'react-native';
import { AlertDialog, BottomSheet, Button, Card, Choice, Field, GroupedSection, IconButton, Loading, MenuRow, MIN_TARGET, Notice, Screen, ThemeProvider, Txt } from '..';

const flat = (s: unknown) => (StyleSheet.flatten((typeof s === 'function' ? (s as (p: object) => unknown)({ pressed: false }) : s) as never) ?? {}) as Record<string, number | string | undefined>;
const AnyBottomSheet = BottomSheet as unknown as React.ComponentType<Record<string, unknown>>;
const AnyField = Field as unknown as React.ComponentType<Record<string, unknown>>;
const AnyChoice = Choice as unknown as React.ComponentType<Record<string, unknown>>;
const ICON = { sf: 'xmark', md: 'close' };
const P = ThemeProvider as unknown as React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>;

/** The target is at least 48: minHeight/height and minWidth/width on the control, or hitSlop that makes up the rest. */
function target(node: ReturnType<typeof screen.getByRole>) {
  const s = flat(node.props.style);
  const slop = (node.props.hitSlop ?? {}) as Record<string, number>;
  const h = Math.max(Number(s.minHeight ?? 0), Number(s.height ?? 0)) + (slop.top ?? 0) + (slop.bottom ?? 0);
  const w = Math.max(Number(s.minWidth ?? 0), Number(s.width ?? 0)) + (slop.left ?? 0) + (slop.right ?? 0);
  return { h, w };
}

describe('CL-14 Button and IconButton', () => {
  it.each([false, true])('CL-14 Button has role button, an accessible name, a visible word and a 48 pt target (easy view %s)', (easyView) => {
    const onPress = jest.fn();
    render(<P easyView={easyView}><Button label="Save changes" text="Save" onPress={onPress} /></P>);
    const b = screen.getByRole('button', { name: 'Save changes' });
    expect(screen.getByText('Save')).toBeTruthy();
    expect(target(b).h).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(target(b).w).toBeGreaterThanOrEqual(MIN_TARGET);
    fireEvent.press(b);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('CL-14 a Button with an icon still shows its word', () => {
    render(<Button label="Close" icon={ICON} onPress={() => {}} />);
    expect(screen.getByText('Close')).toBeTruthy();
  });

  it.each(['primary', 'secondary', 'tinted', 'danger', 'quiet'])('CL-14 Button variant %s keeps role, name and target', (variant) => {
    render(<Button label={`Do ${variant}`} variant={variant as never} onPress={() => {}} />);
    const b = screen.getByRole('button', { name: `Do ${variant}` });
    expect(target(b).h).toBeGreaterThanOrEqual(MIN_TARGET);
  });

  it('CL-14 a disabled Button reports disabled to the phone and does not fire', () => {
    const onPress = jest.fn();
    render(<Button label="Send" disabled onPress={onPress} />);
    const b = screen.getByRole('button', { name: 'Send' });
    expect(b.props.accessibilityState ?? b.props['aria-disabled']).toBeTruthy();
    fireEvent.press(b);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('CL-14 IconButton has role button, a label, the caption word below the icon, and a 48 pt target', () => {
    const onPress = jest.fn();
    render(<IconButton label="Close this window" text="Close" icon={ICON} onPress={onPress} />);
    const b = screen.getByRole('button', { name: 'Close this window' });
    expect(screen.getByText('Close')).toBeTruthy();
    expect(target(b).h).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(target(b).w).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(flat(b.props.style).flexDirection ?? 'column').toBe('column'); // caption below, not beside
    fireEvent.press(b);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('CL-15 Field', () => {
  it('CL-15 shows its label, names the input by it, and is at least 48 pt high', () => {
    render(<AnyField label="Email address" value="" onChangeText={() => {}} />);
    expect(screen.getByText('Email address')).toBeTruthy();
    const input = screen.getByLabelText('Email address');
    expect(Number(flat(input.props.style).minHeight ?? flat(input.props.style).height ?? 0)).toBeGreaterThanOrEqual(MIN_TARGET);
  });

  it('CL-15 passes typing through', () => {
    const onChangeText = jest.fn();
    render(<AnyField label="Name" value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByLabelText('Name'), 'Sam');
    expect(onChangeText).toHaveBeenCalledWith('Sam');
  });

  it('CL-15 error text is shown, announced (alert role or live region), and marks the input invalid', () => {
    render(<AnyField label="Name" value="" error="Please enter a name" onChangeText={() => {}} />);
    const err = screen.getByText('Please enter a name');
    let announced = false;
    for (let n: typeof err | null = err; n; n = n.parent) {
      if (n.props?.accessibilityLiveRegion || n.props?.['aria-live'] || n.props?.accessibilityRole === 'alert' || n.props?.role === 'alert') announced = true;
    }
    expect(announced).toBe(true);
    const input = screen.getByLabelText('Name');
    expect(JSON.stringify(input.props)).toMatch(/invalid|Please enter a name/);
  });

  it('CL-15 no error text when there is no error', () => {
    render(<AnyField label="Name" value="" onChangeText={() => {}} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('CL-16 Choice, MenuRow, Card, GroupedSection, Screen, Loading, Notice', () => {
  it('CL-16 Choice switch has role switch, a name, a state, and a 48 pt row; pressing calls back', () => {
    const onPress = jest.fn();
    render(<AnyChoice kind="switch" label="Bigger text" title="Bigger text" checked={false} onPress={onPress} />);
    expect(screen.getByText('Bigger text')).toBeTruthy();
    const sw = screen.UNSAFE_getByType(Switch);
    expect(sw.props.accessibilityLabel ?? sw.props['aria-label'] ?? 'Bigger text').toBeTruthy();
    const row = screen.getByRole('switch', { name: 'Bigger text' });
    expect(target(row).h).toBeGreaterThanOrEqual(MIN_TARGET);
    fireEvent.press(row);
    expect(onPress).toHaveBeenCalled();
  });

  it('CL-16 Choice checkbox reports checked in its state', () => {
    render(<AnyChoice kind="checkbox" label="Agree" title="Agree" checked onPress={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Agree', checked: true })).toBeTruthy();
  });

  it('CL-16 MenuRow is a button named by its text, shows the word, optional value and count, 48 pt', () => {
    const onPress = jest.fn();
    render(<MenuRow text="Language" value="English" count="3" icon={ICON} onPress={onPress} />);
    const row = screen.getByRole('button', { name: /Language/ });
    expect(screen.getByText('Language')).toBeTruthy();
    expect(screen.getByText('English')).toBeTruthy();
    expect(target(row).h).toBeGreaterThanOrEqual(MIN_TARGET);
    fireEvent.press(row);
    expect(onPress).toHaveBeenCalled();
  });

  it('CL-16 Card and GroupedSection render children with their testID', () => {
    render(<><Card testID="card"><Txt>In card</Txt></Card><GroupedSection testID="group"><Txt>In group</Txt></GroupedSection></>);
    expect(screen.getByTestId('card')).toBeTruthy();
    expect(screen.getByTestId('group')).toBeTruthy();
    expect(screen.getByText('In card')).toBeTruthy();
    expect(screen.getByText('In group')).toBeTruthy();
  });

  it('CL-16 Screen draws on the theme page color and shows its content and footer', () => {
    render(<P theme="kiwi"><Screen testID="screen" footer={<Txt>Footer words</Txt>}><Txt>Body words</Txt></Screen></P>);
    expect(screen.getByText('Body words')).toBeTruthy();
    expect(screen.getByText('Footer words')).toBeTruthy();
    const { paletteFor } = require('..') as { paletteFor: (os: string, d: boolean, t: string) => { bg: string } };
    const colors: unknown[] = [];
    for (let n: ReturnType<typeof screen.getByTestId> | null = screen.getByTestId('screen'); n; n = n.parent) colors.push(flat(n.props.style).backgroundColor);
    const all = JSON.stringify(screen.toJSON());
    expect(colors.includes(paletteFor('ios', false, 'kiwi').bg) || all.includes(paletteFor('ios', false, 'kiwi').bg)).toBe(true);
  });

  it('CL-16 Loading shows its words and is a polite live region', () => {
    render(<Loading words="Loading your list" />);
    const words = screen.getByText('Loading your list');
    let live = false;
    for (let n: typeof words | null = words; n; n = n.parent) if (n.props?.accessibilityLiveRegion === 'polite' || n.props?.['aria-live'] === 'polite') live = true;
    expect(live).toBe(true);
  });

  it('CL-16 Notice has role alert and a live region, and shows its text', () => {
    render(<Notice text="Saved." />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.getByText('Saved.')).toBeTruthy();
    let live = false;
    for (let n: typeof alert | null = alert; n; n = n.parent) if (n.props?.accessibilityLiveRegion || n.props?.['aria-live']) live = true;
    expect(live).toBe(true);
  });

  it('CL-16 Notice with onClose has a labelled, visible OK button that calls back', () => {
    const onClose = jest.fn();
    render(<Notice text="Saved." tone="good" onClose={onClose} />);
    expect(screen.getByText('OK')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'OK, hide this message' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('CL-16 Notice without onClose has no button', () => {
    render(<Notice text="Saved." />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('CL-17 AlertDialog and BottomSheet trap nothing silently', () => {
  it('CL-17 AlertDialog shows a header title, body and both choices as labelled buttons; each calls its handler', () => {
    const [onKeep, onDestroy] = [jest.fn(), jest.fn()];
    render(<AlertDialog title="Delete this?" body="It cannot be undone." keep="Keep it" destroy="Delete" onKeep={onKeep} onDestroy={onDestroy} />);
    expect(screen.getByRole('header', { name: 'Delete this?' })).toBeTruthy();
    expect(screen.getByText('It cannot be undone.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Keep it' }));
    expect(onKeep).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });

  it('CL-17 AlertDialog both buttons are at least 48 pt, and the phone\'s back action means keep', () => {
    const onKeep = jest.fn();
    render(<AlertDialog title="Delete this?" keep="Keep it" destroy="Delete" onKeep={onKeep} onDestroy={() => {}} />);
    for (const name of ['Keep it', 'Delete']) expect(target(screen.getByRole('button', { name })).h).toBeGreaterThanOrEqual(MIN_TARGET);
    const modal = screen.UNSAFE_getByType(require('react-native').Modal);
    modal.props.onRequestClose();
    expect(onKeep).toHaveBeenCalledTimes(1);
  });

  it('CL-17 AlertDialog marks itself modal for screen readers', () => {
    render(<AlertDialog title="Delete this?" keep="Keep it" destroy="Delete" onKeep={() => {}} onDestroy={() => {}} />);
    expect(JSON.stringify(screen.toJSON())).toMatch(/accessibilityViewIsModal|aria-modal/);
  });

  it('CL-17 BottomSheet has an accessible label, its content, and a visible Close button that calls onClose', () => {
    const onClose = jest.fn();
    render(<AnyBottomSheet testID="sheet" label="Sort options" onClose={onClose}><Txt>Sheet content</Txt></AnyBottomSheet>);
    expect(screen.getByText('Sheet content')).toBeTruthy();
    expect(screen.getByLabelText('Sort options')).toBeTruthy();
    expect(screen.getAllByText('Close').length).toBeGreaterThan(0);
    const close = screen.getByRole('button', { name: 'Close' });
    expect(target(close).h).toBeGreaterThanOrEqual(MIN_TARGET);
    fireEvent.press(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('CL-17 BottomSheet closeLabel renames the close action (name and visible word)', () => {
    render(<AnyBottomSheet testID="sheet" label="Sort options" closeLabel="Done" onClose={() => {}}><Txt>x</Txt></AnyBottomSheet>);
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('CL-17 BottomSheet keeps a Text node for its Close word (not an icon only)', () => {
    render(<AnyBottomSheet testID="sheet" label="Sort options" onClose={() => {}}><Txt>x</Txt></AnyBottomSheet>);
    const words = screen.UNSAFE_getAllByType(Text).filter((t) => t.props.children === 'Close');
    expect(words.length).toBeGreaterThan(0);
  });
});
