// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Phone key/value store: AsyncStorage behind the KV interface. The .web.ts twin uses localStorage instead.
// AsyncStorage is loaded on first use so importing the platform entry never needs the native module.
import type { KV } from './kv';

type AsyncStore = Pick<typeof import('@react-native-async-storage/async-storage').default, 'getItem' | 'setItem' | 'removeItem'>;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const store = (): AsyncStore => { const m = require('@react-native-async-storage/async-storage') as { default?: AsyncStore } & AsyncStore; return m.default ?? m; };

export const asyncStorageKV: KV = {
  getItem: (k) => store().getItem(k),
  setItem: (k, v) => store().setItem(k, v),
  removeItem: (k) => store().removeItem(k),
};
