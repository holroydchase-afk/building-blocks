# BackButton

## What it is for
A way back, top left above a screen's title: a chevron and the previous place's word ("< Settings") as a plain text button.

```tsx
import { BackButton } from '@holroyd/building-blocks/native';
```

## Props
- `to` (required): the place's word, shown beside the chevron.
- `onPress` (required).
- `label`: spoken name when not "Back to <to>".
- `ink`: draw in the text colour instead of the accent, where the screen's one accent belongs to another button.
- `style`.

## Do and don't
**Do**
- Name the place you go back to, not "Back".
- Put it above the title, not in a swipe-only gesture.

**Don't**
- Don't use it as an icon-only button.

## Accessibility
Role `button`, named "Back to <to>". At least 48 pt tall, 60 pt in Easy view. The word scales with the phone's text size.

Stories: `src/native/stories/BackButton.stories.tsx` (Light, Dark, EasyView).
