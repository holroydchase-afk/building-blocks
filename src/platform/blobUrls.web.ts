// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Blob URLs held in memory only (no file is written); revoke them when the player closes or at sign-out.
import type { BlobUrls } from './blobUrls';

export type { BlobUrls };
export function createBlobUrls({ type }: { type: string }): BlobUrls {
  const urls = new Map<string, string>();
  return {
    async write(name, bytes) {
      const old = urls.get(name);
      if (old) URL.revokeObjectURL(old);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
      urls.set(name, url);
      return url;
    },
    async remove(name) {
      const url = urls.get(name);
      if (url) URL.revokeObjectURL(url);
      urls.delete(name);
    },
    async clear() {
      for (const url of urls.values()) URL.revokeObjectURL(url);
      urls.clear();
    },
  };
}
