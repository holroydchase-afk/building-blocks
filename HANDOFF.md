# Handoff: building-blocks
<!-- status
stage: review
goal: building-blocks
milestone: CL-M1
now: /native and /platform layers built and green (345 tests, strict lint, Storybook builds); first PR waiting on a base branch (main is empty)
next: Chase says go to seed `main` with a starting commit; then open the first PR from claude/project-thread-i3w0mu; then 1c /platform and 1h /chat
waiting_on_chase:
  - Go to put a starting commit (LICENSE, short README) on main so the first PR has a base
blockers: []
-->
## Done
- Scaffold, studio sync, strict TypeScript and lint (2026-11-26).
- `/native` layer (CL-1..CL-20): pure tokens, ten themes, ThemeProvider and IconProvider, 13 components, stories (Light, Dark, EasyView), per-component docs, golden tokens.json and themes.css. qa-tdd green 3x; privacy-security PASS (P2 notes PS-R1..R4).
- Licence MIT (Chase, Nov 25); seeded files authored only by Chase and Claude on his behalf.

## In progress
- Nothing building; waiting for a base branch on GitHub.
- /platform (PL-1..PL-15, docs/product/SPEC-PLATFORM-LAYER.md): storage, secure session (AES-256-GCM), haptics, bytes, base64, random. qa-tdd found and the engineer fixed 2 P1 and 2 P2 defects; privacy-security PASS.

## Exact next step
Seed `main`, open the first PR, merge on green. Then: `/app-kit`, `/chat` (registry plus fake transport), `create-app`, Hearth hand-over intake.

## Decisions to review
- One repo (`building-blocks`) with subpath layers, not several; messenger and visibility stay separate packages.
- Default font is the system font; a product passes its own. Default `os` follows `Platform.OS`.
- Left in Hearth for now: BackButton, MenuLine, Field underline, photo look helpers. Say if any should move here.
- QA P2 follow-ups: QA-R5..R9 (stricter Screen, large-text and dark-mode contrast tests, device proof of 48pt); PS-R2..R4 (pin actions, secret scanning, SECURITY.md).

- Platform follow-ups: PS-R2 keychain accessibility option, PS-R3 whole-operation lock and key-name escaping, PS-R4 rename or warn for the web twin, PS-R5 bytes doc note, CI dependency scanning.

## Blockers
- None except the base branch.
