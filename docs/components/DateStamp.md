# DateStamp

## What it is for
A small decorative stamp for a card's top-right corner, marked with the month, then the day (today by default).

```tsx
<DateStamp />                       // today
<DateStamp date={new Date(2026, 10, 3)} />
```

## Accessibility
Not a control: hidden from screen readers and touches pass through it. The text still grows with the phone's text size (up to 1.5x). Stories: `Tiles.stories.tsx`.
