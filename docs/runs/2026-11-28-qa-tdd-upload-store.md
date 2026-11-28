# qa-tdd run: web upload byte store (PL-23), 2026-11-28

Findings (QA-R<n> | P | where | problem | test):
QA-R1 | P2 | uploadStore.web.ts indexedDbUploadDb | real IndexedDB path (open, upgrade, versionchange, wipe blocked) only checked for the db name; Map fake elsewhere | none
QA-R2 | P2 | uploadStore.web.ts stage | no test for release() or sweep() landing while a stage is in flight (documented: sweep before stage only) | none
QA-R3 | P2 | uploadStore.web.ts put | verify covers display and thumb, not spec; a caller putting a caption in spec stores it sealed (documented, not enforced) | none
QA-R4 | P2 | uploadStore.web.ts wipe | wipe is best effort when another tab holds the db; no test of the blocked-delete path | none

Boundaries covered: cap exact and cap-1, capBytes 0, empty list, all-clip list, mixed progress totals, repeat/unknown release, empty sweep, reuse after wipe, unknown record version, rejecting sealer, failing keys() then retry, throwing reporter, thumb-only dirty.
Not covered: negative or NaN capBytes (type allows it), real IndexedDB, real WebCrypto, multi-tab.

```agentrun
date: 2026-11-28
agent: qa-tdd
product: Building Blocks
tier: supervised
model: claude-sonnet-5-5
tokens: 0
cost_usd: 0
input: post-build review of the web upload byte store (PL-23)
tool: agent-memory | ok | searched upload store web, no prior finding
tool: agent-guard | ok | kill qa-tdd, exit 0
tool: Bash | ok | qa-run3 on typecheck, lint, jest, build-storybook, 3x each
verdict: green
findings: 4
p0: 0
artifact: src/platform/__tests__/uploadStore.web.boundaries.test.ts
escalated: yes
escalation_reason: harness showed no token or cost count
```
