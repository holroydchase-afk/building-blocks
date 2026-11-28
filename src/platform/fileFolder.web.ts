// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Web twin of fileFolder.ts: a browser keeps no files for viewing (a shared computer is a different risk), so there is no
// folder and the app falls back to loading from the network.
import type { FolderStore } from './fileFolder';

export type { FolderStore };
export function createFileFolder(_o: { folder: string; accepts: RegExp }): FolderStore | null {
  return null;
}
