// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// The theme as React sees it: one context holding the palette, the type set (standard or Easy view), the platform and
// the phone's accessibility settings. ThemeProvider (ThemeProvider.tsx) fills it; without one, components use the
// defaults below (Paper, light, standard text, system font).
import { createContext, useContext } from 'react';
import { Platform, type TextStyle } from 'react-native';
import { paletteFor, TYPE, type Colors, type FontWeightName, type OS, type TextStyleName, type TextStyleSpec, type ThemeName } from './tokens';

/** Fonts a product bundles. Weight comes from the font, never fontWeight: Android can't synthesize a weight
 *  from one font. Without this map the library uses the system font. */
export interface Fonts { regular: string; medium?: string; semibold: string }

export interface ThemeOptions {
  theme?: ThemeName;
  dark?: boolean;
  /** Easy view: every text style is its larger set (nothing under 17). */
  easyView?: boolean;
  /** The phone's Increase Contrast / High contrast text setting. */
  highContrast?: boolean;
  /** The phone's Reduce Motion setting. */
  reduceMotion?: boolean;
  os?: OS;
  fonts?: Fonts;
}

export interface Theme {
  c: Colors;
  /** The named text styles for Easy view on (TYPE.easy) or off (TYPE.standard). */
  type: Record<TextStyleName, TextStyleSpec>;
  theme: ThemeName;
  easyView: boolean; dark: boolean; os: OS; highContrast: boolean; reduceMotion: boolean;
  fonts: Fonts | undefined;
  /** The text style for a name: size, leading and the font (the named font if the product passed fonts, else the system weight). */
  text: (name: TextStyleName, emphasized?: boolean) => TextStyle;
  /** Just the font part of a style, for a weight. */
  font: (weight: FontWeightName) => TextStyle;
}

const WEIGHT = { regular: '400', medium: '500', semibold: '600' } as const;

function defaultOs(): OS {
  return Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : 'ios';
}

export function buildTheme(o: ThemeOptions = {}): Theme {
  const { theme = 'paper', dark = false, easyView = false, highContrast = false, reduceMotion = false, fonts } = o;
  const os = o.os ?? defaultOs();
  const type = TYPE[easyView ? 'easy' : 'standard'];
  const font = (weight: FontWeightName): TextStyle => {
    if (!fonts) return { fontWeight: WEIGHT[weight] };
    return { fontFamily: weight === 'semibold' ? fonts.semibold : weight === 'medium' ? (fonts.medium ?? fonts.regular) : fonts.regular };
  };
  const text = (name: TextStyleName, emphasized = false): TextStyle => {
    const s = type[name];
    return { ...font(emphasized ? 'semibold' : s.weight), fontSize: s.fontSize, lineHeight: s.lineHeight };
  };
  return { c: paletteFor(os, dark, theme, highContrast), type, theme, easyView, dark, os, highContrast, reduceMotion, fonts, text, font };
}

export const ThemeContext = createContext<Theme | null>(null);

let fallback: Theme | null = null;
export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (t) return t;
  fallback ??= buildTheme();
  return fallback;
}
