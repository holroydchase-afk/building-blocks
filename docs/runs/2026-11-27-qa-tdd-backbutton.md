```agentrun
date: 2026-11-27
agent: qa-tdd
product: building-blocks
tier: supervised
model: claude-sonnet-5-5
tokens: 0
cost_usd: 0
input: verify BackButton, MenuLine, Field underline (CL-21..CL-23) on claude/native-backbutton-menuline-field-underline
tool: agent-memory | ok | searched BackButton MenuLine Field underline, no matches
tool: agent-guard | ok | kill
tool: Bash | ok | qa-run3 on test, lint, typecheck; 18 extra parallel jest runs
verdict: flaky
findings: 2
p0: 0
artifact: docs/runs/2026-11-27-qa-tdd-backbutton.md
escalated: yes
escalation_reason: harness showed no token or cost count
```

QA-R1 | P1 | npm test | one of 3 runs failed (424/1), not reproduced in 21 later runs, failing test name not captured | none
QA-R2 | P2 | src/native/__tests__/kitMore.test.tsx | weak: MenuLine marginLeft only >0 (not 40 = icon 26 + gap 14); BackButton does not assert ink colour, Android/pressed opacity, or style passthrough; Field strongLine/underline untested on android os | none
