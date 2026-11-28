// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// "Save to my phone": writes the bytes to a temp file, hands it to the media library, deletes the temp. The library is
// passed in (expo-media-library's functions have this shape; SDK 57 and later import it from 'expo-media-library/legacy'),
// so this layer adds no dependency. Strip anything private (such as location data) before you call it.
import { File, Paths } from 'expo-file-system';

export type SaveResult = 'saved' | 'denied';
/** The part of the phone's media library this needs. */
export interface MediaLibraryLike {
  requestPermissionsAsync(writeOnly?: boolean): Promise<{ granted: boolean }>;
  saveToLibraryAsync(uri: string): Promise<unknown>;
}

export function createSaveToPhone({ library, extension = 'jpg' }: { library: MediaLibraryLike; extension?: string }):
  (bytes: Uint8Array, name: string) => Promise<SaveResult> {
  if (!/^[A-Za-z0-9]{1,8}$/.test(extension)) throw new Error('bad extension');
  return async (bytes, name) => {
    if (!/^[A-Za-z0-9._-]+$/.test(name) || name.startsWith('.')) throw new Error('bad name');
    const perm = await library.requestPermissionsAsync(true);
    if (!perm.granted) return 'denied';
    const file = new File(Paths.cache, `${name}.${extension}`);
    try {
      if (file.exists) file.delete();
      file.create();
      file.write(bytes);
      await library.saveToLibraryAsync(file.uri);
      return 'saved';
    } finally {
      try { file.delete(); } catch { /* already gone */ }
    }
  };
}
