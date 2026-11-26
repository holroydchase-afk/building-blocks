# AlertDialog

## What it is for
A two-choice alert over the screen: a short title, optional body, a safe choice (`keep`) and a destructive one (`destroy`).

```tsx
import { AlertDialog } from '@holroyd/building-blocks/native';
```

## Props
- `title` (required) and `body`.
- `keep` (required): words of the safe choice; semibold, and what the phone's back action does.
- `destroy` (required): words of the destructive choice, in red.
- `onKeep` and `onDestroy` (required).

## Do and don't
**Do**
- Name the thing and the consequence in the title ("Delete this item?").
- Make `destroy` a verb that says what it does.

**Don't**
- Don't use it for information; use `Notice`.
- Don't make the destructive choice the default.

## Accessibility
Both choices are labelled buttons, at least 48 pt, with visible words. The title is a header and the dialog is marked modal so a screen reader stays inside it. The phone's back action chooses `keep`, so it is never a trap.

Stories: `src/native/stories/AlertDialog.stories.tsx` (Light, Dark, EasyView).
