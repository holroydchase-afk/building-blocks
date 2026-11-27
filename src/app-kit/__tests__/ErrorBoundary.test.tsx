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

  it('hands onError only the error type and code (never the message or stack) and the screen name', () => {
    const seen: Array<[unknown, string]> = [];
    wrap(<ErrorBoundary screen="Home" onError={(e, s) => { seen.push([e, s]); }}><Bomb /></ErrorBoundary>);
    expect(seen).toHaveLength(1);
    expect(seen[0]?.[0]).toEqual({ name: 'Error' });
    expect(JSON.stringify(seen)).not.toMatch(/secret|user@example|private/);
    expect(seen[0]?.[1]).toBe('Home');
  });

  it('passes a string code through, and a non-error throw reads as Error', () => {
    const seen: unknown[] = [];
    function Coded(): never { throw Object.assign(new TypeError('x'), { code: 'PGRST301' }); }
    wrap(<ErrorBoundary onError={(e) => { seen.push(e); }}><Coded /></ErrorBoundary>);
    expect(seen[0]).toEqual({ name: 'TypeError', code: 'PGRST301' });
  });

  it('a throwing onError still shows the sentence', () => {
    const onError = jest.fn(() => { throw new Error('reporter broke'); });
    wrap(<ErrorBoundary onError={onError}><Bomb /></ErrorBoundary>);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Something went wrong.')).toBeTruthy();
  });

  it('a rejecting onError is swallowed too', async () => {
    const onError = jest.fn(() => Promise.reject(new Error('network down')));
    wrap(<ErrorBoundary onError={onError}><Bomb /></ErrorBoundary>);
    await Promise.resolve();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Something went wrong.')).toBeTruthy();
  });

  it('with no helper the sentence points to the person who set it up', () => {
    wrap(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByText('Close the app and open it again. If it keeps happening, call the person who set it up for you.')).toBeTruthy();
  });

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
