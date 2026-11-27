// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React, { Component, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Txt } from '../native';

interface Props {
  children: ReactNode;
  /** Who to call. */
  helper?: string | null;
  /** Called with the error and the screen name. A throw inside it is swallowed: a report must never cause a second error. */
  onError?: (error: unknown, screen: string) => void | Promise<void>;
  screen?: string;
  title?: string;
  /** Replaces the default sentence (which names `helper`). */
  message?: string;
  retryLabel?: string;
}

/** Last line of defense: a plain sentence and a button, never a stack trace. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(e: unknown) {
    // Only the error's type is logged, never its message (it may hold a caption, a URL or an email).
    console.warn('Screen error', e instanceof Error ? e.name : typeof e);
    try {
      void Promise.resolve(this.props.onError?.(e, this.props.screen ?? 'app')).catch(() => {});
    } catch { /* a report must never cause a second error */ }
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    const { helper, title = 'Something went wrong.', retryLabel = 'Try again' } = this.props;
    const message = this.props.message ?? `Close the app and open it again. If it keeps happening, call ${helper ?? 'the person who set it up for you'}.`;
    return (
      <View style={styles.box}>
        <Txt variant="title2" role="header">{title}</Txt>
        <Txt>{message}</Txt>
        <Button variant="secondary" label={retryLabel} onPress={() => this.setState({ failed: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({ box: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 } });
