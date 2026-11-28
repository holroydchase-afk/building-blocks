# DateStamp

## What it is for
A small decorative stamp for a card's top-right corner, marked with the month, then the day (today by default).

```tsx
<DateStamp />                       // today
<DateStamp date={new Date(2026, 10, 3)} />
```

## Accessibility
Not a control and decoration only, by choice: it repeats a date the card's own words already give, so it is hidden from screen readers and touches pass through it. A product that has no such words should say the date in the card's accessibility label instead. The text still grows with the phone's text size (up to 1.5x) and uses the headline style. Stories: `Tiles.stories.tsx`.
