// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// A folder of named files in the app's cache folder, for kept bytes (a media cache, decrypted files a player needs).
// The phone may clear the cache when space is low, so nothing here is the only copy. The web twin keeps no files.
import { Directory, File, Paths } from 'expo-file-system';

export interface FolderStore {
  /** The bytes, or null when the name is not accepted or there is no such file. */
  read(name: string): Promise<Uint8Array | null>;
  /** Writes (replacing any file of that name) and returns the file's uri. Throws `bad name` for a name the rule does not accept. */
  write(name: string, bytes: Uint8Array): Promise<string>;
  /** Quiet when the name is not accepted or there is no such file. */
  remove(name: string): Promise<void>;
  /** The accepted names in the folder. */
  list(): Promise<string[]>;
  /** Deletes the folder and everything in it. */
  clear(): Promise<void>;
}

/** `folder` is one plain name under the cache folder. `accepts` is the rule every file name must pass, so a name from
 *  outside (a server id, a path) can never reach beyond that folder: make it strict, such as /^[A-Za-z0-9-]+\.mp4$/. */
export function createFileFolder({ folder, accepts }: { folder: string; accepts: RegExp }): FolderStore {
  if (!/^[A-Za-z0-9._-]+$/.test(folder) || folder.startsWith('.')) throw new Error('bad folder');
  const rule = new RegExp(accepts.source, accepts.flags.replace(/[gy]/g, '')); // a g or y flag would make the rule remember its last match
  const ok = (n: string) => n.length > 0 && !n.startsWith('.') && !n.includes('/') && !n.includes('\\') && rule.test(n);
  const dir = () => new Directory(Paths.cache, folder);
  return {
    async read(name) {
      if (!ok(name)) return null;
      const f = new File(dir(), name);
      return f.exists ? f.bytes() : null;
    },
    async write(name, bytes) {
      if (!ok(name)) throw new Error('bad name');
      const d = dir();
      if (!d.exists) d.create({ intermediates: true, idempotent: true });
      const f = new File(d, name);
      if (f.exists) f.delete();
      f.create();
      f.write(bytes);
      return f.uri;
    },
    async remove(name) {
      if (!ok(name)) return;
      const f = new File(dir(), name);
      if (f.exists) f.delete();
    },
    async list() {
      const d = dir();
      return d.exists ? d.list().map((x) => x.name).filter(ok) : [];
    },
    async clear() {
      const d = dir();
      if (d.exists) d.delete();
    },
  };
}
