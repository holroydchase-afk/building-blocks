# GroupedSection

## What it is for
The Settings-style grouped section: a surface-colored block with rounded corners (an outlined card on Android), for lists of settings and rows.

```tsx
import { GroupedSection } from '@holroyd/building-blocks/native';
```

## Props
- `children`.
- `style`, `testID`.

## Do and don't
**Do**
- Put `MenuRow` and `Choice` rows inside it.
- Use one per topic, with a header above.

**Don't**
- Don't nest one inside another.
- Don't use it for ordinary content; use `Card`.

## Accessibility
A plain container with no role of its own. The surface color keeps ink at 4.5:1 or better in every theme and mode, and the android outline is a visible edge.

Stories: `src/native/stories/GroupedSection.stories.tsx` (Light, Dark, EasyView).
