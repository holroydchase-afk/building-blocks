# BottomSheet

## What it is for
A sheet from the bottom of the screen for a short list of options or a small task. It has a grabber and closes with a swipe down on the grabber, a tap outside, or the phone's back action, and always a visible Close button. It is at most 560 wide (centred on big screens) and 88% of the screen tall; tall content scrolls inside while Close stays in view.

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
- Don't rely on the swipe or the tap outside; the Close button always stays.
- Don't stack sheets.
- Don't use it for a form with unsent typing: a stray tap outside closes it at once. Sheets are for choices; for typing use a screen.

## Accessibility
The sheet has an accessible name and is marked modal. The tap-outside area is hidden from screen readers, so there is only one Close. The visible Close button is a full `Button` (labelled, 48 pt), so closing never needs a gesture. With the phone's Reduce Motion on, the sheet fades in instead of sliding.

Stories: `src/native/stories/BottomSheet.stories.tsx` (Light, Dark, EasyView, LongContent).
