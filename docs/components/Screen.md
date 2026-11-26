# Screen

## What it is for
A whole screen on the theme's page color, inside the safe area, scrolling by default, with an optional footer fixed under the words.

```tsx
import { Screen } from '@holroyd/building-blocks/native';
```

## Props
- `children`.
- `scroll`: scrolls (default true). Pass false for a screen that fills the space.
- `footer`: the screen's one main action, fixed above any tab bar so it never needs scrolling to reach.
- `testID`.

## Do and don't
**Do**
- Put a form's Save button in `footer`.
- Wrap a floating tab bar's height with `TabBarSpaceContext` so content clears it.

**Don't**
- Don't nest scrolling screens.
- Don't put more than one main action in the footer.

## Accessibility
It keeps content inside the safe area, keeps the keyboard from covering fields (`keyboardShouldPersistTaps="handled"`, automatic keyboard insets), and the footer is always on screen so the main action is reachable without scrolling.

Stories: `src/native/stories/Screen.stories.tsx` (Light, Dark, EasyView).
