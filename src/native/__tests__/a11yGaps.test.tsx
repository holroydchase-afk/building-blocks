// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// CL-14..CL-17 gap tests added by qa-tdd (QA-R1..QA-R5): the first-pass tests used `??` fallbacks and truthy checks that pass trivially.
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Choice, Field, MIN_TARGET, Notice } from '..';

const AnyField = Field as unknown as React.ComponentType<Record<string, unknown>>;
const AnyChoice = Choice as unknown as React.ComponentType<Record<string, unknown>>;
const st = (n: { props: { style?: unknown } }) => StyleSheet.flatten((typeof n.props.style === 'function' ? (n.props.style as (p: object) => never)({ pressed: false }) : n.props.style) as never) as Record<string, number>;

describe('CL-14 gaps', () => {
  it('CL-14 an enabled Button reports disabled=false and a disabled one disabled=true (strict)', () => {
    const { rerender } = render(<Button label="Send" onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Send' }).props.accessibilityState.disabled).toBe(false);
    rerender(<Button label="Send" disabled onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Send' }).props.accessibilityState.disabled).toBe(true);
  });
  it('CL-14 a busy Button reports busy, is announced disabled and does not fire', () => {
    const onPress = jest.fn();
    render(<Button label="Save" busy onPress={onPress} />);
    const b = screen.getByRole('button', { name: 'Save' });
    expect(b.props.accessibilityState.busy).toBe(true);
    fireEvent.press(b);
    expect(onPress).not.toHaveBeenCalled();
  });
  it('CL-14 a link-role Button keeps its name and 48 pt target', () => {
    render(<Button label="Terms" role="link" onPress={() => {}} />);
    expect(Number(st(screen.getByRole('link', { name: 'Terms' })).minHeight)).toBeGreaterThanOrEqual(MIN_TARGET);
  });
});

describe('CL-15 gaps', () => {
  it('CL-15 aria-invalid is true with an error and false without', () => {
    const { rerender } = render(<AnyField label="Name" value="" error="Required" onChangeText={() => {}} />);
    expect(screen.getByLabelText('Name').props['aria-invalid']).toBe(true);
    rerender(<AnyField label="Name" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText('Name').props['aria-invalid']).toBe(false);
  });
});

describe('CL-16 gaps', () => {
  it('CL-16 Choice switch exposes checked and disabled state strictly', () => {
    const { rerender } = render(<AnyChoice kind="switch" label="Bigger text" title="Bigger text" checked onPress={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Bigger text', checked: true })).toBeTruthy();
    rerender(<AnyChoice kind="switch" label="Bigger text" title="Bigger text" checked={false} disabled onPress={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Bigger text', checked: false }).props.accessibilityState.disabled).toBe(true);
  });
  it('CL-16 Notice OK button has a 48 pt target', () => {
    render(<Notice text="Saved." onClose={() => {}} />);
    expect(Number(st(screen.getByRole('button', { name: 'OK, hide this message' })).minHeight)).toBeGreaterThanOrEqual(MIN_TARGET);
  });
});
