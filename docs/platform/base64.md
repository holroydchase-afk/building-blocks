# base64

## What it is for
Pure base64 that works on every runtime (no `atob`, `btoa` or `Buffer`).

## Usage
```ts
import { fromBase64, toBase64 } from '@holroyd/building-blocks/platform';

const text = toBase64(new Uint8Array([1, 2, 3]));
const back = fromBase64(text); // also accepts base64url
```

## Do and don't
**Do**
- Expect `Error('invalid base64')` for bad characters.

**Don't**
- Don't use it for large files in a hot loop; it is plain JavaScript.
