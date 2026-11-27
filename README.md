# building-blocks

Building Blocks: the studio's React Native tokens, theme and components (and the device and app pieces behind them): design tokens, a theme and accessible building blocks that work on iPhone, Android and the web (React Native Web), with a Storybook catalog. Package `@holroyd/building-blocks`.

Accessibility is the contract: every tappable control has an accessibility label, a visible word and a 48 pt minimum target; text scales with the phone's text size; Easy view keeps every style at 17 or more; ink on the page is 7:1 and accent text 4.5:1 in every theme, mode and high-contrast set.

## Use

```tsx
import { ThemeProvider, Screen, Txt, Button } from '@holroyd/building-blocks/native';

export function App() {
  return (
    <ThemeProvider theme="paper" dark={false} easyView={false}>
      <Screen footer={<Button label="Save changes" text="Save" onPress={save} />}>
        <Txt variant="largeTitle" role="header">Settings</Txt>
      </Screen>
    </ThemeProvider>
  );
}
```

`ThemeProvider` props, all optional: `theme` (Paper or one of nine fruit themes), `dark`, `easyView`, `highContrast`, `reduceMotion`, `os` (`ios`, `android`, `web`) and `fonts`.

- **Fonts.** The library uses the system font. Bundle your own in the app and pass `fonts={{ regular, medium?, semibold }}` (font names). No font package is a dependency and nothing is fetched at runtime.
- **Icons.** Icons take `{ sf, md }` names (SF Symbol, Material Symbol). The default draws them with `expo-symbols` on iPhone and Android and a text glyph on the web; wrap your tree in `IconProvider` with a `render(icon, { color, size })` to use your own set.
- **Tokens.** `src/native/tokens.ts` is pure data (no React or React Native). `docs/design/tokens.json` and `docs/design/themes.css` are generated from it (CSS variables for web products: `<html data-theme="avocado" data-mode="dark">`).

## Platform

`@holroyd/building-blocks/platform` holds the small device pieces every app needs, each with a phone version, a web twin and a test fake: key/value storage, encrypted session storage, haptics, `readBytes`, base64 and secure random. Peers: `@react-native-async-storage/async-storage`, `expo-secure-store`, `expo-haptics`, `expo-file-system`, `expo-crypto`. One page per module in `docs/platform/`.

## Components

`Txt`, `Button`, `IconButton`, `Field`, `Choice`, `MenuRow`, `Card`, `GroupedSection`, `Screen`, `Loading`, `Notice`, `AlertDialog`, `BottomSheet`. Each has a page in `docs/components/` and a Storybook story with Light, Dark and EasyView.

## Commands

```
npm run typecheck
npm run lint            # STUDIO_LINT_STRICT=1 in CI
npm test
npm run storybook       # dev
npm run build-storybook
UPDATE_TOKENS=1 npx jest tokens   # regenerate docs/design after a token change
```

## Licence

MIT, copyright Chase Holroyd (see `LICENSE`). Seeded once from the studio's first app; see `NOTICE`.
