# Field

## What it is for
A text field with its label above it. The label is always visible and is the field's accessible name; an error shows as words below.

```tsx
import { Field } from '@holroyd/building-blocks/native';
```

## Props
- `label` (required): visible label and accessible name.
- `error`: error words, shown below, announced to screen readers, and the input is marked invalid.
- `underline`: no fill; a hairline rule under the words, for writing on the surface the field sits on. `strongLine` draws that rule in the stronger edge colour for a surface where the plain line reads too faint.
- Every `TextInput` prop (`value`, `onChangeText`, `placeholder`, `keyboardType`, ...).

## Do and don't
**Do**
- Say what went wrong and how to fix it in `error`.
- Use `keyboardType`, `autoComplete` and `textContentType` to match the data.

**Don't**
- Don't use a placeholder instead of a label.
- Don't signal an error by color alone; the `error` words are required.

## Accessibility
The input is named by its label. The error sits in an alert live region, so it is announced when it appears, and the input reports `aria-invalid`. The field is at least 56 pt tall. On the web it draws a 2 pt focus edge. While it is focused, `useTyping()` is true so a tab bar can step aside.

Stories: `src/native/stories/Field.stories.tsx` (Light, Dark, EasyView).
