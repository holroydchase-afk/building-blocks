// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-20..PL-22: the platform pieces Hearth built for kept media, made generic: a folder of named mockFiles in the app's
// cache (names checked against a rule the app gives), blob URLs held in memory (web), and "save to the phone".
// Written first (red) by qa-tdd, 2026-11-28.
const mockFiles = new Map<string, Uint8Array>();
const mockDirs = new Set<string>();
jest.mock('expo-file-system', () => {
  class Directory {
    uri: string;
    constructor(base: string | { uri: string }, name?: string) { this.uri = `${typeof base === 'string' ? base : base.uri}/${name ?? ''}`.replace(/\/$/, ''); }
    get exists() { return mockDirs.has(this.uri); }
    create() { mockDirs.add(this.uri); }
    delete() { mockDirs.delete(this.uri); for (const k of [...mockFiles.keys()]) if (k.startsWith(`${this.uri}/`)) mockFiles.delete(k); }
    list() { return [...mockFiles.keys()].filter((k) => k.startsWith(`${this.uri}/`)).map((k) => ({ name: k.slice(this.uri.length + 1) })); }
  }
  class File {
    uri: string;
    constructor(base: string | { uri: string }, name?: string) { this.uri = name == null ? String(typeof base === 'string' ? base : base.uri) : `${typeof base === 'string' ? base : base.uri}/${name}`; }
    get exists() { return mockFiles.has(this.uri); }
    create() { mockFiles.set(this.uri, new Uint8Array()); }
    write(b: Uint8Array) { mockFiles.set(this.uri, b); }
    delete() { mockFiles.delete(this.uri); }
    bytes() { return Promise.resolve(mockFiles.get(this.uri)!); }
  }
  return { Directory, File, Paths: { cache: { uri: 'file:///cache' } } };
});
import { createFileFolder } from '../fileFolder';
import { createSaveToPhone } from '../saveToPhone';

beforeEach(() => { mockFiles.clear(); mockDirs.clear(); });
const mk = () => createFileFolder({ folder: 'kept', accepts: /^[A-Za-z0-9-]+\.(thumb|display)$/ })!;

describe('PL-20 createFileFolder (phone)', () => {
  it('writes, reads, lists, removes and clears named mockFiles in its own cache folder', async () => {
    const f = mk();
    await f.write('abc-1.thumb', Uint8Array.from([1, 2]));
    await f.write('abc-1.display', Uint8Array.from([3]));
    expect(Array.from((await f.read('abc-1.thumb'))!)).toEqual([1, 2]);
    expect((await f.list()).sort()).toEqual(['abc-1.display', 'abc-1.thumb']);
    expect([...mockFiles.keys()].every((k) => k.startsWith('file:///cache/kept/'))).toBe(true);
    await f.remove('abc-1.thumb');
    expect(await f.read('abc-1.thumb')).toBeNull();
    await f.clear();
    expect(await f.list()).toEqual([]);
  });
  it('write returns the file uri and replaces an earlier file of the same name', async () => {
    const f = mk();
    const uri = await f.write('a.thumb', Uint8Array.from([1]));
    expect(uri).toBe('file:///cache/kept/a.thumb');
    await f.write('a.thumb', Uint8Array.from([7, 7]));
    expect(Array.from((await f.read('a.thumb'))!)).toEqual([7, 7]);
  });
  it.each(['../x.thumb', 'a/b.thumb', 'a.png', '', 'a b.thumb', '.thumb'])('a name the rule does not accept (%j) is never read, removed or listed, and writing it throws', async (name) => {
    const f = mk();
    mockFiles.set('file:///cache/outside.thumb', Uint8Array.from([1]));
    expect(await f.read(name)).toBeNull();
    await f.remove(name);
    await expect(f.write(name, Uint8Array.from([1]))).rejects.toThrow('bad name');
    expect(mockFiles.has('file:///cache/outside.thumb')).toBe(true);
  });
  it('list ignores mockFiles in the folder the rule does not accept', async () => {
    const f = mk();
    await f.write('ok.thumb', Uint8Array.from([1]));
    mockFiles.set('file:///cache/kept/stray.txt', Uint8Array.from([1]));
    expect(await f.list()).toEqual(['ok.thumb']);
  });
  it('reading, removing or clearing something that is not there is quiet', async () => {
    const f = mk();
    expect(await f.read('none.thumb')).toBeNull();
    await expect(f.remove('none.thumb')).resolves.toBeUndefined();
    await expect(f.clear()).resolves.toBeUndefined();
  });
  it('a folder name that could climb out of the cache is refused', () => {
    expect(() => createFileFolder({ folder: '../x', accepts: /./ })).toThrow('bad folder');
    expect(() => createFileFolder({ folder: 'a/b', accepts: /./ })).toThrow('bad folder');
    expect(() => createFileFolder({ folder: '', accepts: /./ })).toThrow('bad folder');
  });
  it('a rule with the g or y flag does not make results depend on earlier calls', async () => {
    const f = createFileFolder({ folder: 'k', accepts: /^[a-z]+\.bin$/g })!;
    await f.write('a.bin', Uint8Array.from([1]));
    await f.write('b.bin', Uint8Array.from([2]));
    expect(await f.read('a.bin')).not.toBeNull();
    expect(await f.read('a.bin')).not.toBeNull();
    expect((await f.list()).sort()).toEqual(['a.bin', 'b.bin']);
  });
});

describe('PL-22 createSaveToPhone (phone)', () => {
  const lib = (granted: boolean) => ({
    requestPermissionsAsync: jest.fn(async () => ({ granted })),
    saveToLibraryAsync: jest.fn(async (_uri: string) => undefined),
  });
  it('asks permission, hands the file to the library, then deletes the temp file', async () => {
    const l = lib(true);
    const save = createSaveToPhone({ library: l });
    let seenInside: Uint8Array | undefined;
    l.saveToLibraryAsync.mockImplementation(async (uri: string) => { seenInside = mockFiles.get(uri); });
    expect(await save(Uint8Array.from([5, 6]), 'pic')).toBe('saved');
    expect(l.requestPermissionsAsync).toHaveBeenCalledWith(true);
    expect(l.saveToLibraryAsync).toHaveBeenCalledWith('file:///cache/pic.jpg');
    expect(Array.from(seenInside!)).toEqual([5, 6]);
    expect(mockFiles.size).toBe(0);
  });
  it('is denied without writing anything when permission is refused', async () => {
    const l = lib(false);
    expect(await createSaveToPhone({ library: l })(Uint8Array.from([1]), 'pic')).toBe('denied');
    expect(l.saveToLibraryAsync).not.toHaveBeenCalled();
    expect(mockFiles.size).toBe(0);
  });
  it('deletes the temp file even when the library throws, and passes the error on', async () => {
    const l = lib(true);
    l.saveToLibraryAsync.mockRejectedValue(new Error('disk full'));
    await expect(createSaveToPhone({ library: l })(Uint8Array.from([1]), 'pic')).rejects.toThrow('disk full');
    expect(mockFiles.size).toBe(0);
  });
  it('takes the file extension as an option', async () => {
    const l = lib(true);
    await createSaveToPhone({ library: l, extension: 'png' })(Uint8Array.from([1]), 'pic');
    expect(l.saveToLibraryAsync).toHaveBeenCalledWith('file:///cache/pic.png');
  });
  it.each(['../pic', 'a/b', ''])('a file name that could climb out of the cache (%j) is refused', async (name) => {
    await expect(createSaveToPhone({ library: lib(true) })(Uint8Array.from([1]), name)).rejects.toThrow('bad name');
  });
});

describe('PL-21 createBlobUrls (phone)', () => {
  it('says plainly it is for the web', () => {
    const { createBlobUrls } = require('../blobUrls') as typeof import('../blobUrls');
    expect(() => createBlobUrls({ type: 'video/mp4' })).toThrow('use createFileFolder');
  });
});
