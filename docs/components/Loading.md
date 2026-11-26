# Loading

## What it is for
A spinner with words, so people know something is happening and what.

```tsx
import { Loading } from '@holroyd/building-blocks/native';
```

## Props
- `words` (required): what is loading ("Loading your list").

## Do and don't
**Do**
- Say what is loading in plain words.

**Don't**
- Don't show a spinner alone.
- Don't leave it on screen forever; follow it with a result or an error.

## Accessibility
The words are in a polite live region, so a screen reader announces them when the spinner appears.

Stories: `src/native/stories/Loading.stories.tsx` (Light, Dark, EasyView).
