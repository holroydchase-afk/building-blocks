# Card

## What it is for
A padded group of related content with no fill and no outline: content sits on the plain page.

```tsx
import { Card } from '@holroyd/building-blocks/native';
```

## Props
- `children`.
- `style`, `testID`.

## Do and don't
**Do**
- Use it to group related content with consistent padding and gap.

**Don't**
- Don't add a fill or an outline to make it look like a box; use `GroupedSection` for settings-style lists.

## Accessibility
A Card is a plain container with no role of its own, so it adds nothing to the reading order. Put a header (`Txt role="header"`) inside when the group needs a name.

Stories: `src/native/stories/Card.stories.tsx` (Light, Dark, EasyView).
