# webStorage

## What it is for
Browser storage that never throws. `webStorage()` returns `localStorage` or `undefined` when the browser blocks it; `webKV()` is a `KV` over it that keeps values in memory when storage is blocked or full.

## Usage
```ts
import { webKV, webStorage } from '@holroyd/building-blocks/platform';

const kv = webKV();
await kv.setItem('seen', '1'); // fine even in a private window
const ls = webStorage(); // Storage | undefined
```

## Do and don't
**Do**
- Treat a blocked browser as normal: values last for the visit.
- Use the same keys you would use with localStorage.

**Don't**
- Don't touch `window.localStorage` directly; the getter itself can throw.
