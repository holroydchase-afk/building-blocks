# IconButton

## What it is for
A compact toolbar action: the icon over a short word, like a tab. It is never icon-only.

```tsx
import { IconButton } from '@holroyd/building-blocks/native';
```

## Props
- `label` (required): the accessible name.
- `text` (required): the visible caption under the icon.
- `icon` (required): `{ sf, md }` symbol names.
- `onPress` (required), `testID`.

## Do and don't
**Do**
- Keep the caption to one or two words.
- Use it for common actions in a row (Add, Share, Close).

**Don't**
- Don't hide the caption to save space.
- Don't use it for the one main action of a screen; use `Button`.

## Accessibility
Role `button` with a label, and iOS's large content viewer shows the caption. The target is at least 60 by 60 pt. The caption grows with the text size up to 1.5x so a row still fits.

Stories: `src/native/stories/IconButton.stories.tsx` (Light, Dark, EasyView).
