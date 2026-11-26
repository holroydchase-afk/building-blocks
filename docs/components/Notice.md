# Notice

## What it is for
A short message in the flow of the screen, with an optional visible OK button to hide it.

```tsx
import { Notice } from '@holroyd/building-blocks/native';
```

## Props
- `text` (required): the message.
- `tone`: `info` (default) or `good`.
- `onClose`: shows an OK button (accessible name "OK, hide this message") that calls it.

## Do and don't
**Do**
- Keep it to a sentence.
- Use `good` for a confirmation.

**Don't**
- Don't use it for a choice that needs an answer; use `AlertDialog`.
- Don't rely on the tone's color to carry the meaning; write it in the words.

## Accessibility
The message has role `alert` inside a polite live region, so it is announced when it appears. The OK button is a full `Button`: labelled, visible and 48 pt.

Stories: `src/native/stories/Notice.stories.tsx` (Light, Dark, EasyView).
