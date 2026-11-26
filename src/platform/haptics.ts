// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Light feedback for taps and successes. Nothing on web; a phone with haptics off feels nothing; failures are silent.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'tap' | 'success';

export function haptic(kind: HapticKind): void {
  if (Platform.OS === 'web') return;
  try {
    const p = kind === 'tap'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    void Promise.resolve(p).catch(() => {});
  } catch {
    /* haptics unavailable */
  }
}
