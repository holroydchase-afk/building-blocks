# qa-tdd run 2026-11-28, claude/platform-media-pieces

QA-R1 | P2 | src/platform/saveToPhone.ts, saveToPhone.web.ts | name has no length cap (folder floor caps at 128) | none
QA-R2 | P2 | src/platform/__tests__/blobUrls.web.test.ts | web twin of saveToPhone has no bad-name test (../pic, a/b, empty, leading dot) | none
QA-R3 | P2 | src/platform/__tests__/fileFolder.test.ts | no test for rule flags i and m (an m rule could match across a newline; the floor stops it but nothing proves it) | none
QA-R4 | P2 | src/platform/fileFolder.ts list() | a subdirectory named like an accepted file is listed, and read would call bytes() on a directory | none
QA-R5 | P2 | src/platform/fileFolder.ts write() | a throw between create() and write() leaves an empty file that read() returns as valid empty bytes | none
QA-R6 | P2 | src/platform/saveToPhone.web.ts | setTimeout 10s revoke is never tested (fake timers) and keeps a jest handle open | none

```agentrun
date: 2026-11-28
agent: qa-tdd
product: Building Blocks
tier: supervised
model: claude-sonnet-5-5
tokens: 0
cost_usd: 0
input: post-build verification of platform media pieces PL-20..PL-22
tool: agent-memory | ok | checked fileFolder path blob
tool: agent-guard | ok | kill
tool: Bash | ok | qa-run3 typecheck, lint, jest, build-storybook
verdict: green
findings: 6
p0: 0
artifact: docs/runs/2026-11-28-qa-tdd-platform-media.md
escalated: yes
escalation_reason: harness showed no token or cost count
```
