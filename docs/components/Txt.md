# Txt

## What it is for
Every piece of text. It takes one of the eleven named styles from `TYPE`, picks its color from the theme by `tone`, and scales with the phone's text size.

```tsx
import { Txt } from '@holroyd/building-blocks/native';
```

## Props
- `variant`: a text style name (`largeTitle`, `title1`, `title2`, `title3`, `headline`, `body`, `callout`, `subheadline`, `footnote`, `caption1`, `caption2`). Default `body`.
- `tone`: `ink` (default), `muted`, `accent` or `danger`.
- `emphasized`: semibold weight.
- `role`: `header` makes a heading; `level` overrides its level (1 or 2).
- `label`: what a screen reader says, when it must differ from the text.
- `style`, `numberOfLines`, `selectable`, `testID`.

## Do and don't
**Do**
- Use `body` for anything read at length; keep the smaller styles (`callout` to `caption2`) for secondary words.
- Give each screen one level-1 header (`largeTitle` or `title1`), and `role="header"` on every other heading.
- Use `tone`, never a hand-picked color.

**Don't**
- Don't set `allowFontScaling` off: text must follow the phone's text size.
- Don't set a color or font size by hand; add a token instead.
- Don't use `muted` for words that must be read first.

## Accessibility
Text grows with the phone's text size and Easy view raises every style to 17 or more. Ink on the page is 7:1 and muted 4.5:1 in every theme and mode. Headers carry `accessibilityRole="header"` and an `aria-level`.

Stories: `src/native/stories/Txt.stories.tsx` (Light, Dark, EasyView).
