# MenuRow

## What it is for
A big list row that goes somewhere: an icon, a word, an optional count or value, and a chevron, all one target.

```tsx
import { MenuRow } from '@holroyd/building-blocks/native';
```

## Props
- `text` (required): the row's words and accessible name.
- `icon` (required): `{ sf, md }` symbol names.
- `count`: an accent count such as "2 new". `value`: a setting's state in words, such as "English".
- `onPress` (required), `testID`.

## Do and don't
**Do**
- Group rows in a `GroupedSection`.
- Use `value` to show a setting's state in words.

**Don't**
- Don't use it for a setting you can change in place; use `Choice`.
- Don't leave out the words and rely on the icon.

## Accessibility
Role `button`. The accessible name is the words, then the count and value ("Messages, 2 new"). The row is at least 60 pt tall.

Stories: `src/native/stories/MenuRow.stories.tsx` (Light, Dark, EasyView).
