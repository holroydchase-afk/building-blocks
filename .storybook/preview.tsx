// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// The toolbar: theme, light/dark, Easy view, high contrast and platform. A story can set its own starting values with
// `globals` (the Light, Dark and EasyView stories do).
import React, { useEffect, type ComponentType, type ReactNode } from 'react';
import { View } from 'react-native';
import { ThemeProvider, THEME_NAMES, useTheme, type OS, type ThemeName } from '../src/native';

const item = (value: string, title: string) => ({ value, title });

function Backdrop({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  // The canvas page itself takes the theme's page color, so dark mode is dark all the way to the edges.
  useEffect(() => {
    if (typeof document !== 'undefined') document.body.style.backgroundColor = c.bg;
  }, [c.bg]);
  return <View style={{ padding: 16, backgroundColor: c.bg }}>{children}</View>; // eslint-disable-line react-native/no-inline-styles
}

type Globals = Partial<Record<'theme' | 'mode' | 'easy' | 'contrast' | 'os', string>>;

export default {
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  initialGlobals: { theme: 'paper', mode: 'light', easy: 'off', contrast: 'normal', os: 'web' },
  globalTypes: {
    theme: { description: 'Theme', toolbar: { title: 'Theme', icon: 'paintbrush', dynamicTitle: true, items: THEME_NAMES.map((n) => item(n, n)) } },
    mode: { description: 'Light or dark', toolbar: { title: 'Mode', icon: 'contrast', dynamicTitle: true, items: [item('light', 'Light'), item('dark', 'Dark')] } },
    easy: { description: 'Easy view', toolbar: { title: 'Easy view', icon: 'zoom', dynamicTitle: true, items: [item('off', 'Easy view off'), item('on', 'Easy view on')] } },
    contrast: { description: 'Contrast', toolbar: { title: 'Contrast', icon: 'accessibility', dynamicTitle: true, items: [item('normal', 'Normal contrast'), item('more', 'High contrast')] } },
    os: { description: 'Platform', toolbar: { title: 'Platform', icon: 'mobile', dynamicTitle: true, items: [item('web', 'Web'), item('ios', 'iPhone'), item('android', 'Android')] } },
  },
  decorators: [
    (Story: ComponentType, { globals }: { globals: Globals }) => (
      <ThemeProvider
        theme={(globals.theme ?? 'paper') as ThemeName}
        dark={globals.mode === 'dark'}
        easyView={globals.easy === 'on'}
        highContrast={globals.contrast === 'more'}
        os={(globals.os ?? 'web') as OS}
      >
        <Backdrop><Story /></Backdrop>
      </ThemeProvider>
    ),
  ],
};
