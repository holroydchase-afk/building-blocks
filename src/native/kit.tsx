// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Accessible building blocks in each phone's own style: Apple's on iPhone and the web, Material 3 on Android. Every
// tappable thing is a Button, IconButton, MenuRow or Choice: it always has an accessibility label, a visible word and a
// 48 pt minimum target.
import React, { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Modal, PanResponder, Pressable, type PanResponderCallbacks, ScrollView, StyleSheet, Switch, Text, TextInput, View,
  useWindowDimensions, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { defaultIconRender, useIconRender, type Icon } from './IconProvider';
import { useTabBarSpace } from './tabBarSpace';
import { useTheme } from './theme';
import { dialogRadius, iconSize, LABEL_SCALE_CAP, MIN_TARGET, RADIUS, sheetShouldClose, SPACE, type TextStyleName } from './tokens';
import { useTypingField } from './typing';

const CLEAR = 'transparent';
const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants', 'aria-hidden': true } as const;

/** A system symbol (decorative, hidden from screen readers), drawn by the default renderer or the IconProvider's. */
function SystemIcon({ icon, color, size = 22 }: { icon: Icon; color: string; size?: number }) {
  const { os } = useTheme();
  const custom = useIconRender();
  // Symbols grow with the phone's text size, like the words beside them (up to LABEL_SCALE_CAP).
  const { fontScale } = useWindowDimensions();
  const opts = { color, size: iconSize(size, fontScale) };
  // The default drawing is hidden here; a product's own renderer is trusted to draw decoratively (the words beside the
  // icon, and the control's label, carry the meaning).
  return custom ? <>{custom(icon, opts)}</> : <View {...hidden}>{defaultIconRender(os)(icon, opts)}</View>;
}

/** Txt's color, separate from its style: a muted body is body + tone="muted". */
export type TxtTone = 'ink' | 'muted' | 'accent' | 'danger';

export function Txt({ variant = 'body', tone = 'ink', emphasized, level, style, children, role, testID, numberOfLines, selectable, label }: {
  selectable?: boolean;
  /** What a screen reader says, when it must be the words exactly (a heading built from parts). Defaults to the text. */
  label?: string;
  /** One of the named text styles (TYPE). */
  variant?: TextStyleName; tone?: TxtTone; emphasized?: boolean;
  /** A header's level when it is not the style's own. */
  level?: 1 | 2;
  style?: StyleProp<TextStyle>; children?: ReactNode; role?: 'header' | 'alert' | 'text'; testID?: string; numberOfLines?: number;
}) {
  const { c, text } = useTheme();
  const color = { ink: c.ink, muted: c.muted, accent: c.accent, danger: c.dangerText }[tone];
  return (
    <Text
      selectable={selectable}
      accessibilityRole={role === 'text' ? undefined : role}
      // One level-1 heading per screen (the page title, largeTitle or title1); every other heading is level 2, so a
      // screen reader's heading list reads like an outline.
      {...(role === 'header' ? { 'aria-level': level ?? (variant === 'largeTitle' || variant === 'title1' ? 1 : 2) } : {})}
      accessibilityLabel={label}
      testID={testID}
      numberOfLines={numberOfLines}
      style={[text(variant, emphasized), { color }, style]}
    >
      {children}
    </Text>
  );
}

/** primary (filled accent) and danger (filled red) are for the few deliberate big buttons. tinted is the small accent
 *  capsule for a screen's main tap word; secondary the grey capsule; quiet a text button or link. Every one stays 48 pt
 *  tall to tap. */
export type ButtonVariant = 'primary' | 'secondary' | 'tinted' | 'danger' | 'quiet';

export function Button({ label, text, onPress, variant = 'primary', disabled, softDisabled, style, selected, testID, busy, role = 'button', icon, ink }: {
  /** A quiet button in the words' own color, for secondary tools (the accent is saved for the one main tap word). */
  ink?: boolean;
  /** What a screen reader says. Required: no unlabeled targets. */
  label: string;
  /** Visible words; defaults to the label. */
  text?: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Looks and reads as off, but a tap still reaches onPress so the screen can say why ("Pick one above first."). */
  softDisabled?: boolean;
  selected?: boolean;
  busy?: boolean;
  /** A system symbol shown before the words, never instead of them. */
  icon?: Icon;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  role?: 'button' | 'link';
}) {
  const { c, os, text: type } = useTheme();
  const material = os === 'android';
  // iPhone: filled, grey (tinted fill) and plain buttons. Android: filled, outlined and text buttons.
  // A waiting button is solid grey with readable words, never a see-through one.
  const waiting = !!disabled || !!softDisabled;
  const bg = waiting && variant !== 'quiet' ? c.fill : { primary: c.accent, secondary: material ? CLEAR : c.fill, tinted: c.accentSoft, danger: c.danger, quiet: CLEAR }[variant];
  const fg = waiting ? c.muted : { primary: c.accentInk, secondary: c.ink, tinted: c.accent, danger: c.onDanger, quiet: ink ? c.ink : c.accent }[variant];
  const border = variant === 'secondary' && material ? c.muted : bg;
  const words = text ?? label;
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ disabled: waiting, selected: !!selected, busy: !!busy }}
      // undefined, not false: Pressable copies a boolean `disabled` over accessibilityState and would undo softDisabled
      disabled={disabled || busy || undefined}
      onPress={onPress}
      testID={testID}
      android_ripple={{ color: c.line }}
      style={({ pressed }) => [
        styles.btn,
        variant === 'tinted' ? styles.capsule : null,
        { backgroundColor: bg, borderColor: border, opacity: !waiting && pressed && !material ? 0.7 : 1 },
        selected ? { borderColor: c.accent, borderWidth: 2, backgroundColor: c.accentSoft } : null,
        style,
      ]}
    >
      {busy ? <ActivityIndicator color={fg} /> : null}
      {icon && !busy ? <SystemIcon icon={icon} color={selected ? c.accent : fg} /> : null}
      {typeof words === 'string' ? (
        <Text style={[type('headline'), styles.center, { color: selected ? c.ink : fg }]}>{words}</Text>
      ) : (
        words
      )}
    </Pressable>
  );
}

/** A compact toolbar button for common actions: the icon over a short word, like a tab. Never icon-only; the word stays
 *  17 pt or more and the target 48 pt. */
export function IconButton({ label, text, icon, onPress, testID }: { label: string; text: string; icon: Icon; onPress: () => void; testID?: string }) {
  const { c, text: type } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityShowsLargeContentViewer
      accessibilityLargeContentTitle={text}
      onPress={onPress}
      testID={testID}
      android_ripple={{ color: c.line, borderless: true }}
      style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.7 : 1 }]}
    >
      <SystemIcon icon={icon} color={c.ink} size={28} />
      {/* A toolbar word stops growing at 1.5x so the row still fits at the largest text size. */}
      <Text maxFontSizeMultiplier={LABEL_SCALE_CAP} style={[type('body'), { color: c.ink }]}>{text}</Text>
    </Pressable>
  );
}

const CHEVRON: Icon = { sf: 'chevron.forward', md: 'chevron_right' };

/** A big list row: icon, word, an optional accent count ("2 new") and/or a value in words ("English"), and a chevron;
 *  the whole row is one 48 pt+ target. The screen reader hears the word, then the count and value ("Messages, 2 new"). */
export function MenuRow({ text, icon, count, value, onPress, testID }: { text: string; icon: Icon; count?: string | null; value?: string | null; onPress: () => void; testID?: string }) {
  const { c, os, text: type } = useTheme();
  const extra = [count, value].filter(Boolean).join(', ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={extra ? `${text}, ${extra}` : text}
      onPress={onPress}
      testID={testID}
      android_ripple={{ color: c.line }}
      style={({ pressed }) => [styles.menuRow, { opacity: pressed && os !== 'android' ? 0.7 : 1 }]}
    >
      <SystemIcon icon={icon} color={c.ink} size={26} />
      <Text style={[type('body'), styles.grow, { color: c.ink }]}>{text}</Text>
      {count ? <Text style={[type('headline'), { color: c.accent }]}>{count}</Text> : null}
      {value ? <Text style={[type('body'), { color: c.muted }]}>{value}</Text> : null}
      <SystemIcon icon={CHEVRON} color={c.muted} size={18} />
    </Pressable>
  );
}

/** A whole-row checkbox, radio or switch: the full row is the 48 pt+ target, a plain grouped row like the phone's own
 *  settings. A picked radio shows an accent check mark at the end; a checkbox shows an empty box that fills with an
 *  accent check. Switches are the phone's own switch with the word On or Off beside it. */
export function Choice({ label, title, detail, checked, onPress, kind, disabled }: {
  label: string; title: string; detail?: string; checked: boolean; onPress: () => void; kind: 'checkbox' | 'radio' | 'switch';
  /** Can't be tapped, but stays fully readable (never faded); the detail line says why. */
  disabled?: boolean;
}) {
  const { c, os, text: type } = useTheme();
  const box: Icon = checked ? { sf: 'checkmark.square.fill', md: 'check_box' } : { sf: 'square', md: 'check_box_outline_blank' };
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={label}
      accessibilityState={disabled ? { checked, disabled: true } : { checked }}
      accessibilityHint={kind === 'switch' ? detail : undefined}
      aria-checked={checked} // the web build reads aria-checked, not accessibilityState
      disabled={disabled || undefined}
      onPress={onPress}
      android_ripple={{ color: c.line }}
      style={({ pressed }) => [styles.choice, { opacity: pressed && os !== 'android' ? 0.7 : 1 }]}
    >
      {kind === 'checkbox' ? <SystemIcon icon={box} color={checked ? c.accent : c.muted} size={26} /> : null}
      <View style={styles.grow}>
        <Txt variant="headline">{title}</Txt>
        {detail ? <Txt tone="muted">{detail}</Txt> : null}
      </View>
      {kind === 'radio' && checked ? <SystemIcon icon={{ sf: 'checkmark', md: 'check' }} color={c.accent} size={26} /> : null}
      {kind === 'switch' ? (
        <View style={styles.switchBox} pointerEvents="none" {...hidden}>
          <Text style={[type('headline'), { color: c.ink }]}>{checked ? 'On' : 'Off'}</Text>
          {/* The web's default On thumb is teal (phones ignore activeThumbColor); the Off track is muted, not line,
              so the switch shows at 3:1 (WCAG 1.4.11). */}
          <Switch value={checked} disabled={disabled} trackColor={{ true: c.accent, false: c.muted }} {...({ activeThumbColor: c.surface } as object)} />
        </View>
      ) : null}
    </Pressable>
  );
}

/** A text field with its label above, always visible and used as the accessible name. An error shows as words below,
 *  announced by screen readers, and marks the input invalid. At least 48 pt tall. */
export function Field(props: TextInputProps & { label: string; error?: string }) {
  const { c, os, text: type } = useTheme();
  const { label, error, style, onFocus, onBlur, ...rest } = props;
  const typing = useTypingField(); // a tab bar steps aside while this field is focused
  const [focused, setFocused] = useState(false);
  // iPhone and the web: a filled rounded box with no edge. Android: Material's outlined text field.
  const box: TextStyle = os === 'android'
    ? { borderWidth: 1, borderColor: c.muted, backgroundColor: CLEAR, borderRadius: RADIUS.small }
    : { borderWidth: 0, backgroundColor: c.fill, borderRadius: RADIUS.medium };
  // On the web a rounded field draws its own 2 pt focus edge that follows its corners; at rest the edge is clear so
  // focusing never shifts the words. Phones keep their own focus look.
  const ring: TextStyle | null = os === 'web' ? { borderWidth: 2, borderColor: focused ? c.accent : CLEAR, outlineStyle: 'none' } as unknown as TextStyle : null;
  const bad: TextStyle | null = error ? { borderWidth: 2, borderColor: c.dangerText } : null;
  return (
    <View style={styles.field}>
      <Txt variant="headline">{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        aria-invalid={!!error}
        placeholderTextColor={c.muted}
        {...rest}
        onFocus={(e) => { typing.onFocus(); setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { typing.onBlur(); setFocused(false); onBlur?.(e); }}
        style={[styles.input, type('body'), { color: c.ink }, box, ring, bad, style]}
      />
      {error ? (
        <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Txt variant="subheadline" tone="danger">{error}</Txt>
        </View>
      ) : null}
    </View>
  );
}

/** Content sits on the plain background, so a Card is only a padded group with no fill or outline. Settings-style
 *  lists use GroupedSection instead. */
export function Card({ children, style, testID }: { children?: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  return <View testID={testID} style={[styles.card, style]}>{children}</View>;
}

/** The Settings-style grouped section (iPhone inset grouped list; Android outlined card), for settings lists. */
export function GroupedSection({ children, style, testID }: { children?: ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const { c, os } = useTheme();
  const look = os === 'android' ? { borderWidth: 1, borderColor: c.line, borderRadius: RADIUS.medium } : { borderWidth: 0, borderRadius: RADIUS.medium };
  return <View testID={testID} style={[styles.card, { backgroundColor: c.surface }, look, style]}>{children}</View>;
}

/** A screen on the page color, inside the safe area. `footer` is the screen's one main action, fixed under the
 *  scrolling words and above any tab bar, so it is on screen without scrolling (a form's Save). */
export function Screen({ children, scroll = true, testID, footer }: { children?: ReactNode; scroll?: boolean; testID?: string; footer?: ReactNode }) {
  const { c } = useTheme();
  const under = useTabBarSpace(); // room under a floating tab bar
  const room = under && !footer ? { paddingBottom: SPACE.xxl + under } : null;
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.fill, { backgroundColor: c.bg }]} testID={testID}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.screen, room]} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>{children}</ScrollView>
      ) : (
        <View style={[styles.screen, styles.fill, room]}>{children}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { backgroundColor: c.bg, borderTopColor: c.line, paddingBottom: SPACE.md + under }]}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}

/** A spinner WITH words: people need to know something is happening. */
export function Loading({ words }: { words: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.loading} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={c.muted} />
      <Txt tone="muted">{words}</Txt>
    </View>
  );
}

/** A short message in the flow of the screen. A live region, so screen readers announce it; with `onClose` it gets a
 *  visible "OK" button. */
export function Notice({ text, onClose, tone = 'info' }: { text: string; onClose?: () => void; tone?: 'info' | 'good' }) {
  const { c } = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: tone === 'good' ? c.safeSoft : c.accentSoft, borderColor: c.line }]}>
      <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.grow}>
        <Txt style={{ color: tone === 'good' ? c.safe : c.ink }}>{text}</Txt>
      </View>
      {onClose ? <Button label="OK, hide this message" text="OK" variant="secondary" onPress={onClose} /> : null}
    </View>
  );
}

/** An iOS-style alert over the screen: a short title, then two plain text buttons side by side with no fill. The safe
 *  choice (`keep`) is semibold and is what the phone's back action does; the destructive one is red regular words. */
export function AlertDialog({ title, body, keep, destroy, onKeep, onDestroy }: {
  title: string; body?: string; keep: string; destroy: string; onKeep: () => void; onDestroy: () => void;
}) {
  const { c, os, text: type, font } = useTheme();
  const words = (label: string, color: string, weight: 'regular' | 'semibold', onPress: () => void, first: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={({ pressed }) => [styles.alertBtn, first ? { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: c.line } : null,
        { backgroundColor: pressed ? c.fill : CLEAR }]}>
      <Text style={[type('body'), font(weight), styles.center, { color }]}>{label}</Text>
    </Pressable>
  );
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onKeep}>
      <View style={[styles.scrim, { backgroundColor: c.scrim }]}>
        <View accessibilityViewIsModal aria-modal style={[styles.alert, { backgroundColor: c.surface, borderRadius: dialogRadius(os) }]}>
          <View style={styles.alertWords}>
            <Txt variant="headline" role="header" style={styles.center}>{title}</Txt>
            {body ? <Txt style={styles.center}>{body}</Txt> : null}
          </View>
          <View style={[styles.alertRow, { borderTopColor: c.line }]}>
            {words(keep, c.ink, 'semibold', onKeep, true)}
            {words(destroy, c.dangerText, 'regular', onDestroy, false)}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** What a bottom sheet does with a drag: a clear downward drag, released far or fast enough, closes. */
function sheetPan(close: () => void): PanResponderCallbacks {
  return {
    onMoveShouldSetPanResponder: (_e, g) => g.dy > 12 && Math.abs(g.dy) > Math.abs(g.dx) * 2,
    onPanResponderRelease: (_e, g) => { if (sheetShouldClose(g.dy, g.vy)) close(); },
  };
}

/** A sheet from the bottom of the screen. It shows a grabber and closes with a swipe down, but the visible Close
 *  button inside stays (never gesture-only). With Reduce Motion on it fades in instead of sliding. `label` is the
 *  sheet's accessible name. */
export function BottomSheet({ testID, label, onClose, closeLabel = 'Close', children }: {
  testID: string; label: string; onClose: () => void; closeLabel?: string; children?: ReactNode;
}) {
  const { c, os, reduceMotion } = useTheme();
  const drag = useMemo(() => PanResponder.create(sheetPan(onClose)), [onClose]);
  const corner = dialogRadius(os);
  return (
    <Modal transparent visible animationType={reduceMotion ? 'fade' : 'slide'} onRequestClose={onClose}>
      <View style={[styles.sheetScrim, { backgroundColor: c.scrim }]}>
        <SafeAreaView edges={['bottom']} testID={testID} accessibilityLabel={label} accessibilityViewIsModal aria-modal {...drag.panHandlers}
          style={[styles.menu, { backgroundColor: c.surface, borderTopLeftRadius: corner, borderTopRightRadius: corner }]}>
          <View style={[styles.grabber, { backgroundColor: c.muted }]} {...hidden} />
          {children}
          <Button label={closeLabel} variant="quiet" onPress={onClose} />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  alert: { alignSelf: 'center', width: '100%', maxWidth: 320, overflow: 'hidden' },
  alertWords: { paddingHorizontal: SPACE.lg, paddingTop: 20, paddingBottom: SPACE.lg, gap: SPACE.xs },
  alertRow: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  alertBtn: { flex: 1, minHeight: MIN_TARGET, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE.sm, paddingVertical: 10 },
  sheetScrim: { flex: 1, justifyContent: 'flex-end' },
  menu: { padding: 20, paddingTop: SPACE.sm, gap: 14 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: RADIUS.pill, opacity: 0.5 },
  menuRow: { minHeight: MIN_TARGET + 12, minWidth: MIN_TARGET, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  iconBtn: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: MIN_TARGET + 12, minWidth: MIN_TARGET + 12, paddingHorizontal: 6, gap: 2 },
  capsule: { alignSelf: 'flex-start' },
  btn: { minHeight: MIN_TARGET, minWidth: MIN_TARGET, borderRadius: RADIUS.pill, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: SPACE.sm },
  choice: { minHeight: MIN_TARGET + 8, minWidth: MIN_TARGET, paddingVertical: SPACE.sm, flexDirection: 'row', alignItems: 'center', gap: SPACE.md },
  switchBox: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  field: { gap: 6 },
  input: { minHeight: 56, paddingHorizontal: 14, paddingVertical: SPACE.md },
  card: { padding: 14, gap: SPACE.md },
  screen: { padding: SPACE.lg, gap: SPACE.lg, paddingBottom: SPACE.xxl },
  footer: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, gap: SPACE.sm, borderTopWidth: StyleSheet.hairlineWidth },
  loading: { alignItems: 'center', justifyContent: 'center', padding: SPACE.xxl, gap: SPACE.md },
  notice: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, borderRadius: RADIUS.medium, borderWidth: 1, padding: SPACE.md },
  scrim: { flex: 1, justifyContent: 'center', padding: SPACE.lg },
  fill: { flex: 1 },
  grow: { flex: 1 },
  center: { textAlign: 'center' },
});
