# Picture tile look

For a grid or card of pictures, three tokens give the same look everywhere.

- **Corner:** `RADIUS.photo` (16), between a card (12) and a pill.
- **Shadow:** `photoShadow(dark, ink?)` gives one soft shadow in light mode (ink at 10%, 2 pt down, 12 pt blur) and `null` in dark mode, where a shadow only muddies the page. Spread it onto a wrapper around the tile, not the tile itself, so the tile's own rounded corners clip the picture without clipping the shadow.
- **Empty tile:** `c.photo` is the fill shown before a picture loads.

```tsx
import { photoShadow, RADIUS, useTheme } from '@holroyd/building-blocks/native';

const { c, dark } = useTheme();
<View style={[{ borderRadius: RADIUS.photo }, photoShadow(dark, c.ink)]}>
  <View style={{ borderRadius: RADIUS.photo, overflow: 'hidden', backgroundColor: c.photo }}>{/* the picture */}</View>
</View>
```

`boxShadow` works on iPhone, Android and the web.
