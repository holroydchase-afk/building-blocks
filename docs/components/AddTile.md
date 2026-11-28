# AddTile

## What it is for
An outlined "add" tile that sits beside small items: dashed edge, no fill, a plus and a word in the accent.

```tsx
<AddTile label="Add items" onPress={add} />          // visible word "Add"
<AddTile label="Add people" text="Invite" onPress={invite} />
```

## Do and don't
**Do** make `label` say what is added. **Don't** drop the visible word.

## Accessibility
Role `button`, named by `label`, at least 64 pt square. Stories: `Tiles.stories.tsx`.
