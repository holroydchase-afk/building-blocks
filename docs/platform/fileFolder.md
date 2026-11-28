# fileFolder

## What it is for
`createFileFolder({ folder, accepts })`: a folder of named files in the app's cache, for kept bytes (a media cache, a decrypted file a player needs as a file). The phone may clear the cache when space is low, so nothing in it is the only copy. On the web it returns `null`: a browser keeps no files for viewing.

## Usage
```ts
import { createFileFolder } from '@holroyd/building-blocks/platform';

const kept = createFileFolder({ folder: 'kept-media', accepts: /^[A-Za-z0-9-]+\.(small|large)$/ });
const uri = await kept?.write('abc-1.small', bytes); // returns the file uri
const back = await kept?.read('abc-1.small');        // null when missing
```
Methods: `read`, `write`, `remove`, `list`, `clear`.

## Do and don't
**Do**
- Make `accepts` strict. (Under it, a name can only use letters, digits, dot, dash and underscore, up to 128 characters, and not start with a dot.) Every name must pass it, so an id from outside can never name a path beyond the folder. A name that fails is never read, removed or listed, and `write` throws `bad name`.
- Keep `folder` one plain name (no slash, no leading dot); anything else throws `bad folder`.
- Handle `null` for the web.

**Don't**
- Don't forget to call `clear()` at sign-out and when the account changes: files here stay until then (the phone may clear the cache, but not on a schedule).
- Don't keep the only copy of anything here.
- Don't put secrets here unsealed; seal first (see secureSession `sealBytes`).

# blobUrls
`createBlobUrls({ type })` is the web's way to give a player a URL for bytes with no file written: `write(name, bytes)` returns a blob URL (a name written again revokes the old one), `remove` and `clear` revoke. On the phone it throws; use `createFileFolder` there, since a file uri works.

# saveToPhone
`createSaveToPhone({ library, extension })` returns `(bytes, name) => 'saved' | 'denied'`. It asks permission, writes a temp file, hands it to the media library you pass in (expo-media-library's functions have this shape, so this layer adds no dependency), then deletes the temp file, even on an error. On the web it downloads the file. Strip location data and anything private from the bytes first. `extension` is 1 to 8 letters or digits (else `bad extension`). `name` must be a plain name (letters, digits, dot, dash, underscore).
