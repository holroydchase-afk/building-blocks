// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
import React, { Component, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Txt } from '../native';

/** What a reporter may see of an error. */
export interface SafeError { name: string; code?: string }

const CODE = /^[A-Za-z0-9_]{1,20}$/;
function safeError(e: unknown): SafeError {
  const name = e instanceof Error && /^[A-Za-z][A-Za-z0-9_]{0,59}$/.test(e.name) ? e.name : 'Error';
  const code = (e as { code?: unknown } | null)?.code;
  return typeof code === 'string' && CODE.test(code) ? { name, code } : { name };
}

interface Props {
  children: ReactNode;
  /** Who to call. */
  helper?: string | null;
  /**
   * Called with the error's type and code only (never its message or stack, which can hold a caption, URL or
   * email) and the screen name. A throw or rejection inside it is swallowed: a report must never cause a second
   * error. "Try again" re-renders the same children, so a deterministic failure calls this again; de-duplicate
   * in the reporter if it sends over the network.
   */
  onError?: (error: SafeError, screen: string) => void | Promise<void>;
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
      void Promise.resolve(this.props.onError?.(safeError(e), this.props.screen ?? 'app')).catch(() => {});
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
