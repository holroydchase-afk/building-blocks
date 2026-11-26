// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import { SymbolView } from 'expo-symbols';
import React, { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { OS } from './tokens';

/** A system symbol: SF Symbol name on iPhone, Material Symbol name on Android and the web. */
export interface Icon { sf: string; md: string }
export interface IconOpts { color: string; size: number }
export type IconRender = (icon: Icon, opts: IconOpts) => ReactNode;

const IconContext = createContext<IconRender | null>(null);

/** Replaces how every icon in the library is drawn (a product's own icon set, say). The renderer gets `{ sf, md }` names
 *  and the color and size to use. Icons are decorative: the words beside them carry the meaning. */
export function IconProvider({ render, children }: { render: IconRender; children?: ReactNode }) {
  return <IconContext.Provider value={render}>{children}</IconContext.Provider>;
}

export function useIconRender(): IconRender | null {
  return useContext(IconContext);
}

/** Web fallback: a plain text glyph for the icons the library itself uses; anything else shows the name's first letter. */
const GLYPHS: Record<string, string> = {
  settings: '⚙', close: '×', check: '✓', arrow_back: '‹', chevron_right: '›', add: '+',
  check_box: '☑', check_box_outline_blank: '☐',
};

/** SF Symbols on iPhone, Material names on Android (expo-symbols), a text glyph on the web. */
export function defaultIconRender(os: OS): IconRender {
  if (os === 'web') {
    return (icon, { color, size }) => (
      // The glyph's size is already scaled with the text size; it is decorative, so it never grows a second time.
      <Text maxFontSizeMultiplier={1} style={[styles.glyph, { color, fontSize: size, lineHeight: size + 2, width: size + 2 }]}>
        {GLYPHS[icon.md] ?? icon.md.charAt(0).toUpperCase()}
      </Text>
    );
  }
  return (icon, { color, size }) => (
    <SymbolView name={{ ios: icon.sf as never, android: icon.md as never, web: icon.md as never }} size={size} tintColor={color} />
  );
}

const styles = StyleSheet.create({ glyph: { textAlign: 'center' } });
