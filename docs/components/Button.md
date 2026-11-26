# Button

## What it is for
A labelled button for a deliberate action: the words are always visible, the accessible name is always set, and the target is at least 48 pt.

```tsx
import { Button } from '@holroyd/building-blocks/native';
```

## Props
- `label` (required): the accessible name.
- `text`: the visible words; defaults to `label`.
- `onPress` (required).
- `variant`: `primary` (default), `secondary`, `tinted`, `danger`, `quiet`.
- `icon`: `{ sf, md }` symbol names shown before the words, never instead of them.
- `disabled`: off and not pressable. `softDisabled`: looks off but still calls `onPress`, so the screen can say why.
- `busy`, `selected`, `ink`, `role` (`button` or `link`), `style`, `testID`.

## Do and don't
**Do**
- Use `primary` and `danger` for the few big, deliberate actions on a screen.
- Use `softDisabled` when a tap should explain what is missing.
- Give a link-like button `role="link"`.

**Don't**
- Don't make an icon-only button; use `IconButton` (icon over a word) or add `text`.
- Don't shrink the target below 48 pt with `style`.
- Don't put several `primary` buttons on one screen.

## Accessibility
Role `button` (or `link`), a required label, and the state (`disabled`, `selected`, `busy`) is reported to the phone. The minimum target is 48 by 48 pt in every variant. A waiting button keeps readable, high-contrast words.

Stories: `src/native/stories/Button.stories.tsx` (Light, Dark, EasyView).
