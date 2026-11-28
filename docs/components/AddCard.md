# AddCard

## What it is for
An empty card that is one big button. A tap anywhere (the tinted 4:3 spot, the lines below, the padding) calls `onPress`. A disc with `icon` and the `title` sit in the spot.

```tsx
<AddCard label="Add items" title="Add items" icon={{ sf: 'plus', md: 'add' }} onPress={add} inSpot={<DateStamp />}>
  {ruledLines}
</AddCard>
```

## Props
`label` (accessible name), `title` (visible word), `icon`, `onPress`, `testID`, `spotTestID`, `cardStyle`, `inSpot` (rides in the spot's corner), `children` (below the spot).

## Do and don't
**Do** put decoration in `inSpot` or `children`; it is inside the one button. **Don't** put a second control inside.

## Accessibility
One `button` named by `label`. The disc is 52 pt (60 in Easy view) and the symbol does not grow; the title grows with text size. No fixed height, so words are never cut. A press shrinks the card to 0.98 for 120 ms unless Reduce Motion is on.

Stories: `Tiles.stories.tsx`.
