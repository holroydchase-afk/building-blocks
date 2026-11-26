# BottomSheet

## What it is for
A sheet from the bottom of the screen for a short list of options or a small task. It has a grabber and closes with a swipe down, and always a visible Close button.

```tsx
import { BottomSheet } from '@holroyd/building-blocks/native';
```

## Props
- `testID` (required) and `label` (required): the sheet's accessible name.
- `onClose` (required): called by the Close button, the swipe and the phone's back action.
- `closeLabel`: the Close button's name and words (default "Close").
- `children`.

## Do and don't
**Do**
- Keep the content short; a sheet is a quick choice, not a page.
- Name the sheet in `label` by what it is for ("Sort options").

**Don't**
- Don't rely on the swipe; the Close button always stays.
- Don't stack sheets.

## Accessibility
The sheet has an accessible name and is marked modal. The visible Close button is a full `Button` (labelled, 48 pt), so closing never needs a gesture. With the phone's Reduce Motion on, the sheet fades in instead of sliding.

Stories: `src/native/stories/BottomSheet.stories.tsx` (Light, Dark, EasyView).
