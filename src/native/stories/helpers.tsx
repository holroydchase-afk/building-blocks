// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Shared by the story files: the three globals each story sets (the toolbar in .storybook/preview.tsx reads them).
import React, { type ReactNode } from 'react';
import { View } from 'react-native';

export const LIGHT = { mode: 'light', easy: 'off' } as const;
export const DARK = { mode: 'dark', easy: 'off' } as const;
export const EASY = { mode: 'light', easy: 'on' } as const;
export const noop = () => {};

/** Gives a full-screen component (Screen) a height to fill inside the canvas. */
export function Frame({ children }: { children: ReactNode }) {
  return <View style={{ height: 420 }}>{children}</View>; // eslint-disable-line react-native/no-inline-styles
}
