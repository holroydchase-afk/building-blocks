// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Web twin of secureSession.ts. The browser has no secure key store, so this is a test harness only:
// the value stays in localStorage (in memory when the browser blocks it) and is NOT encrypted.
import type { KV } from './kv';
import { webKV } from './webStorage';

export const secureSessionStorage: KV = webKV();
