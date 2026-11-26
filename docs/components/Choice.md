# Choice

## What it is for
A whole-row checkbox, radio or switch: the full row is the target, in the plain grouped style of the phone's own settings.

```tsx
import { Choice } from '@holroyd/building-blocks/native';
```

## Props
- `kind` (required): `checkbox`, `radio` or `switch`.
- `label` (required): the accessible name.
- `title` (required): the visible words. `detail`: a second, muted line.
- `checked` (required) and `onPress` (required).
- `disabled`: not tappable, but never faded; use `detail` to say why.

## Do and don't
**Do**
- Put the row in a `GroupedSection` for a settings list.
- Make `title` and `label` the same words unless a screen reader needs more.

**Don't**
- Don't use a switch for an action; a switch is a setting that is on or off.
- Don't fade a disabled choice; explain it in `detail`.

## Accessibility
Role `checkbox`, `radio` or `switch` with the checked state (and `aria-checked` on the web). The row is at least 56 pt tall. A switch shows the word On or Off beside the control, so state is never color alone.

Stories: `src/native/stories/Choice.stories.tsx` (Light, Dark, EasyView).
