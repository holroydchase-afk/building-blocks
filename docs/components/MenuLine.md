# MenuLine

## What it is for
The thin line between two `MenuRow`s, inset to start where the words start (after the icon and its gap), like the phone's own Settings lists. Never full width.

```tsx
import { MenuLine, MenuRow } from '@holroyd/building-blocks/native';
```

## Do and don't
**Do** put one between rows inside a `GroupedSection`.
**Don't** use it as a general divider; its inset assumes a `MenuRow` above and below.

## Accessibility
Decorative: it has no role or label and takes no focus. Its colour is the theme's line colour in every theme and mode.

Stories: `src/native/stories/MenuRow.stories.tsx` (shown between rows).
