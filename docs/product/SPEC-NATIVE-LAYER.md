# SPEC-NATIVE-LAYER: the `/native` layer (task 1a + 1b)

Source: seeded once from Hearth's `app/src/ui` (`theme.ts`, `tokens.ts`, `kit.tsx`, `typing.ts`, `tabBarSpace.tsx`) and never copied from a product again. Product words are removed; Pieces that carried Hearth's words (FaceTile, AddTile, AddPhotoCard, PostcardStamp, STAMP_MARK, EMOJI_GLYPH) are queued to move here as neutral components (Chase, Nov 26: nothing generic stays in the product).

Job: one typed, accessible set of tokens, theme and components that any studio Expo app (and MVP-o-matic's `create-app`) imports from `@holroyd/building-blocks/native`.
Done when: every CL criterion below has a passing test, the suite is green 3x, `build-storybook` succeeds, lint is clean in strict mode.
Stop rule: nothing product-specific is added (no product words, no product API types). Generic code moves here even if only one product uses it today, because other products and pipelines pull from this library.

## Acceptance criteria

- CL-1 Scripts `typecheck`, `lint`, `test`, `build-storybook` exist and exit 0; CI (`ci.yml`) runs all four on every PR.
- CL-2 `package.json` `exports` has `./native` with types; one public entry (`src/native/index.ts`) exports everything public, nothing deep-imported.
- CL-3 `src/native/tokens.ts` is pure data: it imports neither `react` nor `react-native`.
- CL-4 TYPE scale: standard body 17/22, easy body 21/26; no easy style is under 17; only secondary styles (callout..caption2) are under 17 in standard.
- CL-5 SPACE, RADIUS and `MIN_TARGET = 48` are exported and typed.
- CL-6 Themes: Paper plus the nine fruit themes, light and dark, plus the high-contrast set, via `paletteFor(os, dark, theme, highContrast)`.
- CL-7 Contrast: for every theme, mode and set, ink on bg and surface is at least 7:1 (4.5:1 in standard sets where Hearth's tests allow), muted 4.5:1 on bg and fill, accent 4.5:1 on bg, fill and accentSoft.
- CL-8 `portableTokens()` equals the committed `tokens.json`; `themesCss()` equals the committed `themes.css` (golden, regenerate with `UPDATE_TOKENS=1`).
- CL-9 `themes.css` uses `data-theme` (not a product attribute) and `--font-body` is `system-ui` first.
- CL-10 No product words: a grep over `src/`, `docs/`, `.storybook/`, `tokens.json` and `themes.css` finds no "hearth", "grandparent", "postcard", "family" or "circle".
- CL-11 Font is configurable: `ThemeProvider` takes an optional `fonts` map; default is the system font. No font package is a dependency.
- CL-12 Icons are pluggable: `IconProvider` takes a renderer; the default renders an accessible text glyph fallback on web and `expo-symbols`/Material name on native. Icons take `{ sf, md }` names.
- CL-13 `Txt` scales with the phone's text size (never `allowFontScaling={false}`) and takes a `style` from TYPE.
- CL-14 `Button` and `IconButton` have an accessible role, a label, a visible word under or in the control (IconButton: caption below), and a hit area of at least 48pt.
- CL-15 `Field` has a visible label, an accessible name, error text announced, and a 48pt height.
- CL-16 `Choice`, `MenuRow`, `Card`, `GroupedSection`, `Screen`, `Loading`, `Notice` expose roles and labels; `Notice` uses a live region.
- CL-17 `AlertDialog` and `BottomSheet` trap nothing silently: both have a visible close or cancel action and an accessible label.
- CL-18 `ThemeProvider` switches theme, dark mode and Easy view; components re-render with the new colors and sizes.
- CL-19 Every exported component has a story file with `Light`, `Dark` and `EasyView` stories and a docs page `docs/components/<Name>.md` (what it is for, props, do and don't, accessibility note).
- CL-20 Every source file starts with the SPDX header and copyright; `NOTICE` records the Hearth seed and date.

## Out of scope here
`/platform`, `/app-kit`, `/chat`, `create-app`, Hearth's hand-over PR (1f), MVP-o-matic hook (1g).
