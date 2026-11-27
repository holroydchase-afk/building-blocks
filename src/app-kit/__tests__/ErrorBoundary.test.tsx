// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '../../native';
import { ErrorBoundary } from '../ErrorBoundary';

let boom = true;
function Bomb() {
  if (boom) throw new Error('secret: user@example.com asked for /private/file');
  return null;
}
const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    boom = true;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows a plain sentence, never the error, and can try again', () => {
    wrap(<ErrorBoundary helper="Sam"><Bomb /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong.')).toBeTruthy();
    expect(screen.getByText('Close the app and open it again. If it keeps happening, call Sam.')).toBeTruthy();
    expect(screen.queryByText(/secret|user@example/)).toBeNull();
    boom = false;
    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.queryByText('Something went wrong.')).toBeNull();
  });

  it('hands the error and the screen name to onError, and a throwing onError never causes a second error', () => {
    const seen: Array<[unknown, string]> = [];
    wrap(<ErrorBoundary screen="Home" onError={(e, s) => { seen.push([e, s]); }}><Bomb /></ErrorBoundary>);
    expect(seen).toHaveLength(1);
    expect(seen[0]?.[1]).toBe('Home');
    cleanupThrow();
  });

  function cleanupThrow() {
    wrap(<ErrorBoundary onError={() => { throw new Error('reporter broke'); }}><Bomb /></ErrorBoundary>);
    expect(screen.getAllByText('Something went wrong.').length).toBeGreaterThan(0);
  }

  it('never logs the error message, only its type', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    wrap(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(/secret|user@example|private/);
  });

  it('takes its words from props, so a product can use its own', () => {
    wrap(<ErrorBoundary title="Oops." message="Please restart." retryLabel="Retry"><Bomb /></ErrorBoundary>);
    expect(screen.getByText('Oops.')).toBeTruthy();
    expect(screen.getByText('Please restart.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });
});
