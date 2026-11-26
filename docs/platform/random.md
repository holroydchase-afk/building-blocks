# random

## What it is for
`randomBytes(n)`: secure random bytes from expo-crypto's `getRandomValues`.

## Usage
```ts
import { randomBytes } from '@holroyd/building-blocks/platform';

const key = randomBytes(32);
```

## Do and don't
**Do**
- Use it for keys, nonces and ids.

**Don't**
- Don't replace it with `Math.random`; it throws instead of falling back.
