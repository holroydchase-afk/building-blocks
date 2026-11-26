// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Read a local file or a data/blob/http(s) URI as bytes on iOS and Android. The .web.ts twin always uses fetch.
import { File } from 'expo-file-system';

export async function readBytes(uri: string): Promise<Uint8Array> {
  if (uri.startsWith('data:') || uri.startsWith('blob:') || uri.startsWith('http://') || uri.startsWith('https://')) {
    const r = await fetch(uri);
    if (r.ok === false) throw new Error(`readBytes: HTTP ${r.status}`);
    return new Uint8Array(await r.arrayBuffer());
  }
  return new File(uri).bytes();
}
