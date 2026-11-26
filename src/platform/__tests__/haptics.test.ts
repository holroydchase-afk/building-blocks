// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-8 (docs/product/SPEC-PLATFORM-LAYER.md). Written first (red) by qa-tdd, 2026-11-26.
// Contract, src/platform/haptics.ts:
//   export type HapticKind = 'tap' | 'success'
//   export function haptic(kind: HapticKind): void   (never throws, never returns a promise the caller must handle)
//   'tap' -> Haptics.impactAsync(ImpactFeedbackStyle.Light); 'success' -> Haptics.notificationAsync(NotificationFeedbackType.Success)
//   Platform.OS === 'web' -> does nothing.
import { Platform } from 'react-native';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));
import * as Haptics from 'expo-haptics';
import { haptic } from '../haptics';

const impact = Haptics.impactAsync as jest.Mock;
const notify = Haptics.notificationAsync as jest.Mock;
beforeEach(() => { impact.mockClear(); notify.mockClear(); impact.mockImplementation(() => Promise.resolve()); notify.mockImplementation(() => Promise.resolve()); });

describe('PL-8 haptic', () => {
  it('PL-8 tap calls impactAsync with the light style and nothing else', () => {
    haptic('tap');
    expect(impact).toHaveBeenCalledWith('light');
    expect(notify).not.toHaveBeenCalled();
  });

  it('PL-8 success calls notificationAsync with the success type and nothing else', () => {
    haptic('success');
    expect(notify).toHaveBeenCalledWith('success');
    expect(impact).not.toHaveBeenCalled();
  });

  it('PL-8 does nothing on web', () => {
    const spy = jest.replaceProperty(Platform, 'OS', 'web');
    haptic('tap');
    haptic('success');
    spy.restore();
    expect(impact).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('PL-8 swallows a rejected promise (no unhandled rejection) for both kinds', async () => {
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    impact.mockImplementation(() => Promise.reject(new Error('no haptics')));
    notify.mockImplementation(() => Promise.reject(new Error('no haptics')));
    expect(() => { haptic('tap'); haptic('success'); }).not.toThrow();
    await new Promise((r) => setTimeout(r, 10));
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('PL-8 swallows a synchronous throw from the native module', () => {
    impact.mockImplementation(() => { throw new Error('module missing'); });
    notify.mockImplementation(() => { throw new Error('module missing'); });
    expect(() => { haptic('tap'); haptic('success'); }).not.toThrow();
  });

  it('PL-8 returns undefined (fire and forget)', () => {
    expect(haptic('tap')).toBeUndefined();
  });
});
