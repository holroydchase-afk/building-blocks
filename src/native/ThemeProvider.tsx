// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React, { useMemo, type ReactNode } from 'react';
import { buildTheme, ThemeContext, type ThemeOptions } from './theme';

/** Sets the theme, dark mode, Easy view, high contrast, platform and fonts for everything inside it. All props are optional. */
export function ThemeProvider({ children, theme, dark, easyView, highContrast, reduceMotion, os, fonts }: ThemeOptions & { children?: ReactNode }) {
  const value = useMemo(
    () => buildTheme({ theme, dark, easyView, highContrast, reduceMotion, os, fonts }),
    [theme, dark, easyView, highContrast, reduceMotion, os, fonts],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
