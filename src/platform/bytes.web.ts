// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// Web twin of bytes.ts: every URI is read with fetch (no expo-file-system).
export async function readBytes(uri: string): Promise<Uint8Array> {
  const r = await fetch(uri);
  if (r.ok === false) throw new Error(`readBytes: HTTP ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}
