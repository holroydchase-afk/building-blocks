# state

## What it is for
The small pieces of state an app keeps on the device and at start: when a person last visited, their saved choices, and which backend the app runs on.

## Usage
```ts
import { chainClears, chooseRuntime, createLastSeen, createPrefs, pickBoolean, pickOneOf } from '@holroyd/building-blocks/app-kit';

const lastSeen = createLastSeen({ kv, keyPrefix: 'app.lastSeen.v1' });   // key: app.lastSeen.v1.<userId>
await lastSeen.save(userId, new Date().toISOString());
const since = await lastSeen.load(userId);                                // null on a first open

const prefs = createPrefs<{ easy: boolean; mode: 'light' | 'dark' | 'system' }, boolean>({
  kv,
  key: (scope) => `app.prefs.v1.${scope ?? 'device'}`,
  defaults: (isViewer) => ({ easy: isViewer, mode: 'system' }),
  sanitize: (raw, d) => {
    const r = raw as Record<string, unknown>;
    return { easy: pickBoolean(r.easy, d.easy), mode: pickOneOf(r.mode, ['light', 'dark', 'system'] as const, d.mode) };
  },
});
const mine = await prefs.load(userId, true);
await prefs.save({ ...mine, easy: false }, userId);

const runtime = chooseRuntime({ fake: useFake, makeFake, makeReal, missing: () => (url ? null : 'The app is not set up yet.') });
const signOutClear = chainClears(sessionStore.clear, uploads?.wipe);      // runs in order, never rejects
```

## Rules
- Nothing here throws or rejects. A failing store, a damaged value or a maker that throws gives a plain fallback: no last visit, the defaults, or `{ error: 'The app could not start.' }`.
- `createLastSeen` keeps the time on the device only, one key per person; a value that is not a date reads as no visit.
- `createPrefs` hands `sanitize` only a parsed object (never null, an array or a number); everything else gives the defaults. Pick each field with `pickBoolean` and `pickOneOf` so a wrong type or an unknown choice falls back field by field.
- `save` writes exactly `JSON.stringify(value)`, so keep only plain choices in it.
- `chooseRuntime` builds the fake when `fake` is true; otherwise any text from `missing` (even empty) becomes the error and the real one is never built. Error text from a thrown maker is never passed on.
- `chainClears` skips anything that is not a function and goes on after a step that fails.

## Do and don't
**Do** keep a version in the key prefix (`.v1`) so a changed shape can start fresh.
**Don't** put anything private in a log from these helpers, and don't store secrets in prefs: they are plain text on the device.
