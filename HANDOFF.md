# Handoff: building-blocks
<!-- status
stage: review
goal: building-blocks
milestone: CL-M1
now: CL-M1.2 native layer built and green (170 tests, strict lint, Storybook builds); first PR waiting on a base branch
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

## Exact next step
Seed `main`, open the first PR, merge on green. Then: 1c `/platform`, `/app-kit`, `/chat` (registry plus fake transport), `create-app`, Hearth hand-over intake.

## Decisions to review
- One repo (`building-blocks`) with subpath layers, not several; messenger and visibility stay separate packages.
- Default font is the system font; a product passes its own. Default `os` follows `Platform.OS`.
- Left in Hearth for now: BackButton, MenuLine, Field underline, photo look helpers. Say if any should move here.
- QA P2 follow-ups: QA-R5..R9 (stricter Screen, large-text and dark-mode contrast tests, device proof of 48pt); PS-R2..R4 (pin actions, secret scanning, SECURITY.md).

## Blockers
- None except the base branch.
