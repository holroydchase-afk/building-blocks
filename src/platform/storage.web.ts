// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Web twin of storage.ts: the same localStorage keys AsyncStorage uses on web, kept in memory when the browser blocks storage.
import type { KV } from './kv';
import { webKV } from './webStorage';

export const asyncStorageKV: KV = webKV();
