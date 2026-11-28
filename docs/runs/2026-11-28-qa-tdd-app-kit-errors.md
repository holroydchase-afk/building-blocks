# qa-tdd run: app kit error helpers (AK-10..AK-13), 2026-11-28

Branch claude/app-kit-errors, start commit f7f440e3a1c18a41f26e40aadbcd4f47a89ae819. Post-build pass: 35 boundary tests pass (7d139d8, `[qa:post]`), 7 tests across 5 bugs are red (68effad, `[qa:red BUG-1..5]`), handed to the engineer. Covered: 120/121 character cap, empty and non-string input, 20/21 log entries, 40/41 character names, 20/21 character codes and versions, os spellings, null and blank options, numeric and null codes. Not covered: negative or time-zone input (none of these helpers take numbers or dates beyond the ISO timestamp).

QA-R1 | P0 | src/app-kit/scrub.ts email pattern | an email whose name has a non-English letter (josé@, müller@) is not hidden at all, the \w class is ASCII only | src/app-kit/__tests__/errors.bugs.test.ts
QA-R2 | P1 | src/app-kit/scrub.ts quotes | text in curly single quotes survives | src/app-kit/__tests__/errors.bugs.test.ts
QA-R3 | P1 | src/app-kit/scrub.ts path | a path with a space in a folder name leaves the part after the space | src/app-kit/__tests__/errors.bugs.test.ts
QA-R4 | P2 | src/app-kit/errorReport.ts looksResolved | a route word of 12+ letters (settings/notifications) turns the whole screen into unknown | src/app-kit/__tests__/errors.bugs.test.ts
QA-R5 | P2 | src/app-kit/errors.ts loadFailedWords | a blank reassure gives a line with a leading space | src/app-kit/__tests__/errors.bugs.test.ts
QA-R6 | P2 | src/app-kit/errorReport.ts describeOs | a version cut at 12 characters can end in a dot (ios 1.2.3.4.5.6.), cosmetic, no test filed | none

```agentrun
date: 2026-11-28
agent: qa-tdd
product: Building Blocks
tier: supervised
model: claude-sonnet-5-5
tokens: 0
cost_usd: 0
input: post-build boundary tests for app kit error helpers (AK-10..AK-13)
tool: agent-memory | ok | searched errors app-kit, no match
tool: agent-guard | ok | kill qa-tdd
tool: Bash | ok | qa-run3 on typecheck, lint, jest, build-storybook 3x each
verdict: red
findings: 6
p0: 1
artifact: src/app-kit/__tests__/errors.boundary.test.ts
escalated: yes
escalation_reason: harness showed no token or cost count
```
