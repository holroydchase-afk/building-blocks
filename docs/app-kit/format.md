# format

## What it is for
Small text helpers every app repeats: dates, plurals, name lists and avatar initials. No `Intl` dependency, so old Android and Hermes builds work.

## Usage
```ts
import { andList, count, initialOf, longDay, relativeTime, shortDate } from '@holroyd/building-blocks/app-kit';

shortDate('2026-10-11T12:00:00Z');         // "Sun, Oct 11"
longDay('2026-10-17T12:00:00Z');           // "October 17"
relativeTime(iso, new Date());             // "Just now", "5 minutes ago", "Yesterday", "Nov 3", "Nov 3, 2025"
count(1, 'person', 'people');              // "1 person" (a no-break space joins number and word)
andList(['Sam', 'Alex', 'Jo']);            // "Sam, Alex and Jo"
initialOf('The Smiths');                   // "S" ("Jo Smith" gives "JS", no name gives "?")
```

## Do and don't
**Do** pass `now` to `relativeTime` so tests are stable. **Don't** expect other languages: the words are English.

A bad date reads as an empty string, never "NaN". A clock that runs ahead reads "Just now".
