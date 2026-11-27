# Handoff: building-blocks
<!-- status
stage: review
goal: building-blocks
milestone: CL-M1
now: PR 2 merged (sealed web session); PR 3 open: /app-kit first piece (format, ErrorBoundary, nav factory). Was: PR 2 open: sealed web session store ported from Hearth (372 tests, lint and types green; PS-R1..R5 fixed; QA-R1..R3 P2 open)
next: merge PR 2 on green; then /app-kit (ErrorBoundary, format, mediaStore, state, errors, test helpers, config), /chat and create-app
waiting_on_chase: []
blockers: []
-->
## Done
- Sealed web session store (AES-256-GCM, non-extractable key, byte sealing) ported from Hearth @3f67242/e89a5a3; legacy names and database name are options (2026-11-27). Hearth's native delta since the seed needed nothing (already lint-clean here).
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
- DECIDED (Chase, Nov 26): nothing generic stays in Hearth; the library is what other products and pipelines pull from. To move, with product words turned into options: BackButton, MenuLine, Field underline, photo look helpers, FaceTile/AddTile/PostcardStamp (as neutral components), mediaStore, saveToPhone, videoFiles, web uploadStore, the runtime and fake-runtime pattern, error messages, problem log and error report (injected reporter, version and scrubber).
- Web session QA P2s: QA-R1 clear() should reset the memory switch and migrated flag; QA-R2 name-swap test; QA-R3 unicode and large-value test.
- QA P2 follow-ups: QA-R5..R9 (stricter Screen, large-text and dark-mode contrast tests, device proof of 48pt); PS-R2..R4 (pin actions, secret scanning, SECURITY.md).

- Platform follow-ups: PS-R2 keychain accessibility option, PS-R3 whole-operation lock and key-name escaping, PS-R4 rename or warn for the web twin, PS-R5 bytes doc note, CI dependency scanning.

## Blockers
- None.
