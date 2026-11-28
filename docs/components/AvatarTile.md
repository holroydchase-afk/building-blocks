# AvatarTile

## What it is for
One choosable tile for a group of people: up to three avatars (initials) in a pill, the group's whole name below, and its count in words. Picked shows an accent edge, a tint and a check.

```tsx
import { AvatarTile } from '@holroyd/building-blocks/native';
<AvatarTile name="The Smiths" count={3} avatars={['Sam Smith', 'Jo Lee']} picked={false} across={3} onPress={toggle} />
```

## Props
`name`, `count`, `avatars` (names; the first letter of the last word is shown), `picked`, `onPress`, `across` (how many tiles share a row), `unit` (singular and plural word, default `['person', 'people']`).

## Do and don't
**Do** lay tiles out in a wrapping row and pass the same `across` to each. **Don't** rely on colour alone for picked: the check and the spoken name carry it.

## Accessibility
Role `button`, `selected` state. Name: "<name>, <count words>, picked" or "not picked". At least 48 pt. The whole name is shown (a long word breaks rather than spills); the count word grows with text size.

Stories: `src/native/stories/Tiles.stories.tsx` (Light, Dark, EasyView).
