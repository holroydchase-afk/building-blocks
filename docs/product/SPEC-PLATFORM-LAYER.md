# SPEC-PLATFORM-LAYER: the `/platform` layer (task 1c)

Source: seeded once from Hearth's `app/src/platform` (`kv.ts`, `storage.ts`/`.web.ts`, `webStorage.ts`, `secureSession.ts`/`.web.ts`, `haptics.ts`, `bytes.ts`/`.web.ts`) and `app/src/crypto` (`base64.ts`, `random.ts`). Product words removed. Photo and video pieces (mediaStore, saveToPhone, videoFiles) stay in Hearth until a second product needs them.

Job: the small device pieces every app needs, each with a phone version, a web twin and a test fake, imported from `@holroyd/building-blocks/platform`.
Done when: every PL criterion has a passing test, suite green 3x, strict lint and typecheck clean, Storybook still builds.
Stop rule: nothing is added that a second product would not use.

## Acceptance criteria

- PL-1 `package.json` `exports` has `./platform` with types; one entry `src/platform/index.ts`; the native-only modules have `.web.ts` twins that Metro/Vite resolve on web.
- PL-2 `KV` interface (getItem, setItem, removeItem) and `memoryKV(seed)` with `dump()`, for tests that simulate an app kill.
- PL-3 `asyncStorageKV` wraps AsyncStorage on phones; on web `webKV()` uses localStorage with the same keys.
- PL-4 `webKV` and `webStorage` survive blocked storage (throwing getter, throwing setItem): values stay in memory for the visit and nothing throws.
- PL-5 `secureSessionStorage` encrypts with AES-256-GCM into the KV and keeps only the 32-byte key in SecureStore: set then get round-trips; the stored blob is not the plaintext; a tampered blob or missing key returns null; remove deletes both blob and key; key names are sanitised.
- PL-6 Two different keys never share a key or a blob (isolation), and a second set re-uses the existing key with a fresh nonce.
- PL-7 `secureSession` takes its KV and key store as injectable parameters (`createSecureSessionStorage({ kv, keys })`) so tests need no native modules; the default export wires AsyncStorage and SecureStore. Storage key prefixes are configurable (default `bb_`).
- PL-8 `haptic('tap' | 'success')` does nothing on web, calls expo-haptics on phones, and swallows every failure.
- PL-9 `readBytes(uri)` reads `data:`, `blob:`, `http(s):` via fetch and local files via expo-file-system on phones; web uses fetch only.
- PL-10 `toBase64` and `fromBase64` round-trip every length 0..64, accept base64url, and reject invalid characters.
- PL-11 `randomBytes(n)` returns n bytes from a secure source, throws if none is available (never falls back to Math.random).
- PL-12 No product words (same grep as CL-10) and every source file has the MIT SPDX header and copyright.
- PL-13 No network calls except `readBytes` fetching a URI the caller passes; no telemetry.
- PL-14 New dependencies are peers (`@react-native-async-storage/async-storage`, `expo-secure-store`, `expo-haptics`, `expo-file-system`, `expo-crypto`) plus `@noble/ciphers` as a dependency; each has a one-line reason in the PR.
- PL-15 One docs page per module in `docs/platform/<name>.md` (what it is for, usage, do and don't, a security note for secureSession).
