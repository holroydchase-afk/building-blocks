// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Chase Holroyd
// PL-21, PL-22 (web): blob URLs kept in memory only, and saving a file as a download. Written first (red).
import { createBlobUrls } from '../blobUrls.web';
import { createFileFolder as webFolder } from '../fileFolder.web';
import { createSaveToPhone as webSave } from '../saveToPhone.web';

const made: string[] = [];
const revoked: string[] = [];
beforeEach(() => {
  made.length = 0; revoked.length = 0;
  let n = 0;
  (globalThis as { URL: unknown }).URL = Object.assign(function URL() {}, {
    createObjectURL: () => { const u = `blob:${++n}`; made.push(u); return u; },
    revokeObjectURL: (u: string) => { revoked.push(u); },
  });
});

describe('PL-21 createBlobUrls (web)', () => {
  it('write gives a blob URL and replacing a name revokes the old one', async () => {
    const b = createBlobUrls({ type: 'video/mp4' });
    expect(await b.write('a.mp4', Uint8Array.from([1]))).toBe('blob:1');
    expect(await b.write('a.mp4', Uint8Array.from([2]))).toBe('blob:2');
    expect(revoked).toEqual(['blob:1']);
  });
  it('remove and clear revoke what they drop, and removing an unknown name is quiet', async () => {
    const b = createBlobUrls({ type: 'video/mp4' });
    await b.write('a.mp4', Uint8Array.from([1]));
    await b.write('b.mp4', Uint8Array.from([1]));
    await b.remove('a.mp4');
    await b.remove('zzz.mp4');
    expect(revoked).toEqual(['blob:1']);
    await b.clear();
    expect(revoked).toEqual(['blob:1', 'blob:2']);
  });
});

describe('PL-20 web twin of the folder', () => {
  it('keeps no files: the web build gives null', () => {
    expect(webFolder({ folder: 'k', accepts: /./ })).toBeNull();
  });
});

describe('PL-22 createSaveToPhone (web)', () => {
  it('downloads the file under its name and extension and reports saved', async () => {
    const clicks: { href: string; download: string }[] = [];
    const a = { href: '', download: '', click() { clicks.push({ href: this.href, download: this.download }); }, remove() {} };
    (globalThis as { document: unknown }).document = { createElement: () => a, body: { appendChild: () => {} } };
    expect(await webSave({ extension: 'jpg' })(Uint8Array.from([1]), 'pic')).toBe('saved');
    expect(clicks).toEqual([{ href: 'blob:1', download: 'pic.jpg' }]);
  });
});
