# qa-tdd run: verify BUG-1..5 fixes, app kit error helpers, 2026-11-28

Branch claude/app-kit-errors, start commit f7f440e, fix commit 9273466 (`[qa:fix BUG-1..5]`, src only). `qa-cycle verify --base f7f440e` exited 0. All four suites green 3x, run one at a time with nothing else running (build-storybook was rerun alone after a first run overlapped jest). No source or test file edited. The previously red tests in errors.bugs.test.ts now pass inside the 735-test jest run.

QA-R1 | P0 | src/app-kit/scrub.ts email pattern | unicode email names | fixed in 9273466, errors.bugs.test.ts green
QA-R2 | P1 | src/app-kit/scrub.ts quotes | curly single quotes | fixed in 9273466, green
QA-R3 | P1 | src/app-kit/scrub.ts path | home folder with a space | fixed in 9273466, green
QA-R4 | P2 | src/app-kit/errorReport.ts looksResolved | long plain route word | fixed in 9273466, green
QA-R5 | P2 | src/app-kit/errors.ts loadFailedWords | blank reassure | fixed in 9273466, green
QA-R6 | P2 | src/app-kit/errorReport.ts describeOs | version cut at 12 characters can end in a dot, cosmetic | still open, no test filed

```agentrun
date: 2026-11-28
agent: qa-tdd
product: Building Blocks
tier: supervised
model: claude-sonnet-5-5
tokens: 0
cost_usd: 0
input: verify BUG-1..5 fixes for app kit error helpers
tool: agent-memory | ok | searched error helpers, found the prior QA-R1..R5 run
tool: agent-guard | ok | kill qa-tdd
tool: Bash | ok | qa-cycle verify exit 0; qa-run3 typecheck, lint (STUDIO_LINT_STRICT=1), jest, build-storybook 3x each
verdict: green
findings: 1
p0: 0
artifact: docs/runs/2026-11-28-qa-tdd-app-kit-errors-verify.md
escalated: yes
escalation_reason: harness showed no token or cost count
```
