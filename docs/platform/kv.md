# kv

## What it is for
The tiny key/value contract (`getItem`, `setItem`, `removeItem`, all async) that every storage piece in this layer speaks, plus `memoryKV` for tests.

## Usage
```ts
import { memoryKV, type KV } from '@holroyd/building-blocks/platform';

const kv: KV = memoryKV({ theme: 'paper' });
await kv.setItem('count', '3');
const reborn = memoryKV(kv.dump()); // simulates an app kill: same data, fresh instance
```

## Do and don't
**Do**
- Take a `KV` as a parameter so tests can pass `memoryKV()`.
- Use `dump()` to assert what was stored.

**Don't**
- Don't use `memoryKV` in the shipped app; it forgets everything on restart.
