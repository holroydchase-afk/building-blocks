# haptics

## What it is for
A light tap or a success feel on a phone, with no effect on web.

## Usage
```ts
import { haptic } from '@holroyd/building-blocks/platform';

haptic('tap');
haptic('success');
```

## Do and don't
**Do**
- Pair feedback with a visible change.
- Call it without awaiting; it returns nothing.

**Don't**
- Don't rely on it for meaning: phones can turn haptics off.
