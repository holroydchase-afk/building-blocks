// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// The one public entry of the /native layer: import from '@holroyd/building-blocks/native', never a deep path.
export {
  contrast, dialogRadius, FONT_STACK, iconSize, LABEL_SCALE_CAP, MATERIAL_ROLES, MIN_TARGET, mix, paletteFor, photoShadow, portableTokens, RADIUS,
  SPACE, TEXT_STYLES, THEME_NAMES, themesCss, TYPE,
  type Colors, type FontWeightName, type OS, type TextStyleName, type TextStyleSpec, type ThemeName,
} from './tokens';
export { useTheme, type Fonts, type Theme, type ThemeOptions } from './theme';
export { ThemeProvider } from './ThemeProvider';
export { IconProvider, type Icon, type IconOpts, type IconRender } from './IconProvider';
export { TAB_BAR_FLOAT_SPACE, TabBarSpaceContext, useTabBarSpace } from './tabBarSpace';
export { SHOW_AGAIN_MS, useTyping, useTypingField } from './typing';
export {
  AddCard, AddTile, AlertDialog, AvatarTile, BackButton, BottomSheet, Button, Card, Choice, DateStamp, Field, GroupedSection, IconButton, Loading, MenuLine, MenuRow, Notice, Screen, Txt,
  type ButtonVariant, type TxtTone,
} from './kit';
