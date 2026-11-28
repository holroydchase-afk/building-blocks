// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Web twin of saveToPhone.ts: the browser downloads the file instead. `library` is not needed here.
import type { MediaLibraryLike, SaveResult } from './saveToPhone';

export type { MediaLibraryLike, SaveResult };
export function createSaveToPhone({ extension = 'jpg', mime = 'image/jpeg' }: { library?: MediaLibraryLike; extension?: string; mime?: string } = {}):
  (bytes: Uint8Array, name: string) => Promise<SaveResult> {
  return async (bytes, name) => {
    if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('.')) throw new Error('bad name');
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.${extension}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return 'saved';
  };
}
