# qa-tdd run notes: app-kit state, red (2026-11-28, branch claude/app-kit-state)

Pre-build failing tests for four generic pieces seeded from a product's state folder. No implementation written.

Memory: `node scripts/agent-memory.mjs --agent qa-tdd state prefs kv` found no earlier finding. (The prompt says `tools/`; this repo keeps the same scripts in `scripts/`.)

## What was written (all under CL-31..CL-40)
- `src/app-kit/__tests__/lastSeen.test.ts` CL-31 createLastSeen: key `<prefix>.<user>`, null on empty/damaged/non-date/huge/throwing kv (rejecting, sync-throwing, proxy, frozen), save never throws, odd ids (empty, dotted, `__proto__`), epoch boundary.
- `src/app-kit/__tests__/prefs.test.ts` CL-32 createPrefs (defaults from ctx, scope, bad JSON, non-object JSON never reaches sanitize, sanitize throwing, `__proto__`/`constructor` pollution, fresh defaults each load, 3 MB value, save only JSON.stringify, circular/BigInt/throwing store) and CL-33 pickBoolean/pickOneOf (inherited names, objects that print as a choice, empty allowed list).
- `src/app-kit/__tests__/runtime.test.ts` CL-34 chooseRuntime (fake/real/missing precedence, makers not called, error passthrough, throws incl. non-Error and the missing check give the plain error) and CL-35 chainClears (order, sequential, undefined skipped, reject and sync throw survived, reusable, non-function entries).
- `src/platform/__tests__/objectStore.test.ts` CL-36 createSplitSaver (ported from the product's tests, plus inlineMax boundary and the 1,000,000 default, empty save, reset race, never throws, `__proto__` key, platform entry export), CL-37 objectsPresent (empty value, inherited names, nothing required), CL-38 idbObjects against a small in-memory IndexedDB (global vs passed, name, store option and default, isolation, lazy open, failed open, huge value).
- `src/app-kit/__tests__/stateWords.test.ts` CL-40 the app-kit entry exports the six new functions. No-product-words/SPDX scans already exist in tests/contract.test.ts and tests/platform-contract.test.ts (they scan src/, so these test files carry no product words).

## Red result
All 5 suites fail with `Cannot find module '../lastSeen' | '../prefs' | '../runtime' | '../objectStore'` (and the entry test fails on missing exports): the right reason, the files do not exist. 3 runs, all red (`qa-run3`). `tsc` errors are only the missing modules and the implicit-any they cause; eslint has 0 problems on the new tests.

## Not covered / spec gaps
- `chooseRuntime` when `missing()` returns the empty string: spec silent (error with empty text, or treated as nothing missing?). No test.
- `createPrefs` when `key()` itself throws: spec silent, no test.
- `pickOneOf` with non-string allowed values (numbers): spec types it as strings, not tested.
- `createSplitSaver` with negative or NaN `inlineMax`: not tested.
- Real IndexedDB behaviour (versioning, blocked upgrades, transaction abort) is only simulated by the in-memory fake; a browser run is a manual case.
- Time zones: lastSeen only checks the string parses, nothing is done with the zone.

## Findings
- QA-R1 | P1 | createSplitSaver | Hearth's `k in pending` check treats a `__proto__` key as already known, so those bytes are never stored | src/platform/__tests__/objectStore.test.ts (CL-36 hostile __proto__)
- QA-R2 | P2 | chooseRuntime spec | empty-string `missing()` result and a throwing `missing()` are unspecified | none
- QA-R3 | P2 | createPrefs spec | a throwing `key()` is unspecified | none
- QA-R4 | P2 | prompt/tooling | prompt names `tools/*.mjs`, repo has `scripts/*.mjs`; `agent-guard kill` only runs from scripts/ | none

```agentrun
date: 2026-11-28
agent: qa-tdd
product: Building Blocks
tier: supervised
model: claude-sonnet-5-5
tokens: 0
cost_usd: 0
input: failing tests for app-kit state pieces (CL-31..CL-40)
tool: agent-memory | ok | searched state prefs kv, no prior finding
tool: agent-guard | ok | kill qa-tdd, exit 0
tool: agent-guard | ok | only-tests --base 0a248de, exit 0
tool: Bash | ok | qa-run3 on the 5 new suites, 3x red (modules missing)
verdict: red
findings: 4
p0: 0
artifact: src/platform/__tests__/objectStore.test.ts
escalated: yes
escalation_reason: harness showed no token or cost count
```
