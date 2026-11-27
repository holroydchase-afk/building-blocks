// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import { renderHook } from '@testing-library/react-native';
import React from 'react';
import { createNavContext } from '../nav';

interface Nav { close(): void }
describe('createNavContext', () => {
  it('gives the nav the provider holds', () => {
    const { Provider, useNav } = createNavContext<Nav>('Nav');
    const nav: Nav = { close: jest.fn() };
    const { result } = renderHook(() => useNav(), { wrapper: ({ children }) => <Provider value={nav}>{children}</Provider> });
    expect(result.current).toBe(nav);
  });
  it('throws a plain error naming the context when no provider is above', () => {
    const { useNav } = createNavContext<Nav>('Nav');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useNav())).toThrow('Nav context missing');
  });
});
