# Handoff: building-blocks
<!-- status
stage: review
goal: building-blocks
milestone: CL-M1
now: PRs 1-3, 8, 10 (tiles), 11 (BottomSheet), 12 (photo look) and 13 (platform media pieces) merged; PR open: the web upload byte store, generic (`createUploadStore`, the item and clean-check types injected). Queue: runtime/error patterns, then Hearth imports
next: tiles (FaceTile, AddTile, AddPhotoCard, PostcardStamp) and photo look helpers, then media and upload platform pieces, then runtime and fake-runtime pattern, error messages, problem log, error report; then Hearth's import PRs after a re-diff
waiting_on_chase: []
blockers: []
-->
## Done
- AvatarTile, AddTile, AddCard, DateStamp (CL-24..CL-27) moved over from Hearth's FaceTile, AddTile, AddPhotoCard, PostcardStamp, with product words turned into props (2026-11-28).
- Security CI (intake #7): gitleaks full-history scan, npm audit (prod, high+), CodeQL; every Action pinned to a commit SHA (2026-11-27). Dependency review stays off until the repo's dependency graph is on. React Native a11y lint rules not added: eslint-plugin-react-native-a11y 3.5.1 peers ESLint 3-8, repo is on 9; the 48 pt, label and text-scale contract stays covered by tests and the Storybook a11y addon.
- BackButton, MenuLine and Field `underline` (CL-21..CL-23; `strongLine` dropped, the strong rule is the only one) moved over from Hearth with docs and stories (2026-11-27).
- `/app-kit`: format, ErrorBoundary, createNavContext (PR #3, merged).
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
- Name and scope (Chase, Nov 26; issue 4): Building Blocks everywhere, never "component library"; Hearth is the source of truth; nothing generic stays in Hearth. Atlas-side updates (architect rule carve-out in studio-agents, migration plan rename, STUDIO-STATUS row) are done in their own PRs and files.
- Hand-over queue and gap list from the Hearth assessment: kit gaps PhotoTile, Chip, ListRow, SearchField, EmptyState, ErrorState, ScreenHeader, Badge, Row/Stack; add parseStored(schema), withTimeout; move FakeBackend out of src.
- One repo (`building-blocks`) with subpath layers, not several; messenger and visibility stay separate packages.
- Default font is the system font; a product passes its own. Default `os` follows `Platform.OS`.
- DECIDED (Chase, Nov 26): nothing generic stays in Hearth; the library is what other products and pipelines pull from. To move, with product words turned into options: BackButton, MenuLine, Field underline, photo look helpers, FaceTile/AddTile/PostcardStamp (as neutral components), mediaStore, saveToPhone, videoFiles, web uploadStore, the runtime and fake-runtime pattern, error messages, problem log and error report (injected reporter, version and scrubber).
- Web session QA P2s: QA-R1 clear() should reset the memory switch and migrated flag; QA-R2 name-swap test; QA-R3 unicode and large-value test.
- QA P2 follow-ups: QA-R5..R9 (stricter Screen, large-text and dark-mode contrast tests, device proof of 48pt); PS-R2..R4 (pin actions, secret scanning, SECURITY.md).

- Platform follow-ups: PS-R2 keychain accessibility option, PS-R3 whole-operation lock and key-name escaping, PS-R4 rename or warn for the web twin, PS-R5 bytes doc note, CI dependency scanning.

## Blockers
- None.
