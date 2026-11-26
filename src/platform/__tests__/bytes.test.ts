// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-9, PL-13 (docs/product/SPEC-PLATFORM-LAYER.md). Written first (red) by qa-tdd, 2026-11-26.
// Contract:
//   src/platform/bytes.ts:     readBytes(uri: string): Promise<Uint8Array>
//     data:, blob:, http: and https: URIs go through fetch(uri); anything else is a local file read with
//     expo-file-system's `new File(uri).bytes()`.
//   src/platform/bytes.web.ts: readBytes(uri) always uses fetch(uri) (no expo-file-system).
const fetchMock = jest.fn();
const mockFileBytes = jest.fn();
const mockFileCtor = jest.fn();
jest.mock('expo-file-system', () => ({
  File: class { constructor(uri: string) { mockFileCtor(uri); } bytes() { return mockFileBytes(); } },
}));
import { readBytes } from '../bytes';

const resp = (b: number[]) => ({ arrayBuffer: async () => Uint8Array.from(b).buffer });
beforeEach(() => {
  fetchMock.mockReset(); mockFileBytes.mockReset(); mockFileCtor.mockReset();
  fetchMock.mockResolvedValue(resp([1, 2, 3]));
  mockFileBytes.mockResolvedValue(Uint8Array.from([9, 8]));
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
});

describe('PL-9 readBytes (phone)', () => {
  it.each(['data:text/plain;base64,AQID', 'blob:abc-123', 'http://example.test/a', 'https://example.test/a'])('PL-9 %s is read with fetch', async (uri) => {
    const out = await readBytes(uri);
    expect(fetchMock).toHaveBeenCalledWith(uri);
    expect(mockFileCtor).not.toHaveBeenCalled();
    expect(Array.from(out)).toEqual([1, 2, 3]);
    expect(out).toBeInstanceOf(Uint8Array);
  });

  it.each(['file:///var/mobile/x.bin', '/data/user/0/x.bin', 'content://media/1'])('PL-9 local path %s is read with expo-file-system and never fetched', async (uri) => {
    const out = await readBytes(uri);
    expect(mockFileCtor).toHaveBeenCalledWith(uri);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(Array.from(out)).toEqual([9, 8]);
  });

  it('PL-9 an empty body gives an empty Uint8Array', async () => {
    fetchMock.mockResolvedValue(resp([]));
    expect(await readBytes('data:,')).toHaveLength(0);
  });

  it('PL-9 a failing read rejects (not silently empty)', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(readBytes('https://example.test/a')).rejects.toThrow('offline');
    mockFileBytes.mockRejectedValue(new Error('missing'));
    await expect(readBytes('file:///nope')).rejects.toThrow('missing');
  });

  it('PL-13 readBytes fetches only the exact URI the caller passes, once', async () => {
    await readBytes('https://example.test/only');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toEqual(['https://example.test/only']);
  });
});

describe('PL-9 readBytes (web twin)', () => {
  it('PL-9 bytes.web.ts uses fetch for every uri, including a file path, and does not load expo-file-system', async () => {
    jest.resetModules();
    const loaded = jest.fn();
    jest.doMock('expo-file-system', () => { loaded(); return {}; });
    const { readBytes: web } = require('../bytes.web') as typeof import('../bytes.web');
    const out = await web('/some/local/path');
    expect(fetchMock).toHaveBeenCalledWith('/some/local/path');
    expect(Array.from(out)).toEqual([1, 2, 3]);
    expect(loaded).not.toHaveBeenCalled();
    jest.dontMock('expo-file-system');
  });
});
