---
name: mutation-testing
description: "Use when backend code should be checked with mutation testing tools such as Stryker, PIT, mutmut, or similar: decide when the extra signal is worth running, configure scoped incremental mutation runs, and turn survived, no-coverage, and timeout mutants into focused behavior tests or simpler production code. Backend-focused; skip routine frontend Testing Library work unless the project explicitly has mutation testing there."
---

# Mutation Testing

## Overview

Use this skill when backend code needs the stronger quality signal that regular coverage cannot provide.

Mutation testing is most valuable after the normal focused tests already pass and the remaining question is whether those tests actually observe the important behavior. It should help the agent:

- choose the right time to run mutation tests
- keep mutation runs scoped, cached, and incremental
- treat survived, no-coverage, and timeout mutants as work to resolve
- improve tests through observable backend behavior
- simplify production code when a mutant exposes unreachable or over-defensive logic

This skill is backend-focused. Do not apply it to routine frontend changes by default, especially where Testing Library already proves user-visible UI behavior well.

## Core Rules

- Prefer the repository's existing mutation command and config over inventing a new runner.
- Run normal focused tests, typecheck, or the repo's regular verification path before mutation testing when practical.
- Use mutation testing selectively for meaningful backend behavior, not for every small edit.
- Keep the mutation scope on backend production code with real behavioral risk: API handlers, validation, repositories, SQL, importers, mappers, domain logic, cache/auth logic, and runtime wiring that is intentionally tested.
- Use incremental or cached mutation testing when the tool supports it; repeated local reruns should get smaller after each fix.
- Treat survived mutants, no-coverage mutants, and timeout mutants as quality failures unless there is a narrow documented reason not to.
- Kill mutants by strengthening behavior tests, integration fixtures, or public contract assertions; do not add brittle tests that only observe implementation details.
- If a survivor points at unreachable defensive code, prefer removing or simplifying that code over writing artificial tests for impossible states.
- Handle timeout mutants by fixing unbounded loops, retry paths, sleeps, clocks, async waits, or missing fail-fast boundaries before merely raising timeouts.
- Use coverage ignores only for type-only artifacts, generated/source-map artifacts, or explicitly unreachable platform branches, and leave a short nearby reason.

## Token And Cost Discipline

- Run the smallest honest mutation scope that can cover the changed backend behavior.
- Prefer incremental, cached, file-scoped, or changed-area reruns over repeated full mutation runs.
- Do not paste full mutant reports, long HTML summaries, or every killed mutant into the conversation.
- Summarize only the command, scope, final score, survived/no-coverage/timeout counts, and unresolved mutants.
- Stop once the mutation result is clean or the remaining gap is precise enough to act on; broaden only when the current scope cannot prove the affected behavior.

## TypeScript Backend Bias

For TypeScript backend projects, the proven default shape is Stryker over the repo's normal test runner:

- `mutate` only the backend files whose behavior matters
- enable incremental mode
- use per-test coverage analysis when available
- keep worker concurrency capped so local reruns stay usable
- keep a TypeScript checker enabled
- set mutation thresholds to `100` when the project expects a clean run
- order test files from focused and fast to broader integration tests
- keep mutation testing out of the default fast verify path unless the repo explicitly wants it there

Read [references/mutation-triage-checklist.md](./references/mutation-triage-checklist.md) when configuring a new mutation setup or triaging a non-clean run.

## Workflow

### 1. Decide whether now is the right time

Good times to run mutation testing:

- after changing files included in the repository's configured mutation range
- after changing backend validation, branching, data mapping, SQL, cache, auth, or importer behavior
- after adding or changing tests for a backend bug fix
- before handing off a risky backend refactor
- when regular coverage is high but confidence is still uncertain
- when the repo's instructions or review bar specifically call for it

Usually skip mutation testing for:

- frontend-only UI work covered through Testing Library or E2E behavior
- docs, formatting, generated files, or dependency metadata
- type-only changes that cannot affect runtime behavior
- early red or broken states before the normal tests pass

### 2. Inspect the existing config

Before running or changing mutation tests, identify:

- the command, such as `npm run test:mutation`
- the mutation tool and test runner
- which files are in `mutate`
- whether incremental or cached mode is enabled
- coverage analysis mode
- worker concurrency
- thresholds and fail behavior
- test file order
- ignored files or ignored code blocks

Keep the repo's working setup unless the current task proves it is wrong.

### 3. Run the smallest honest mutation check

Start with the configured mutation command or the smallest supported target that covers the changed backend surface.

Prefer incremental reruns over broad repeated runs. If a full run is too expensive, narrow by file or by changed area only when the tool supports that without hiding affected behavior.

### 4. Triage by mutant outcome

For survived mutants:

- ask what behavior changed but was not observed
- add or strengthen assertions at the most realistic backend test layer
- prefer full response shapes, error bodies, persisted data, metadata, cache headers, or operator summaries over internal call assertions
- simplify production code when the mutant proves a branch is unnecessary

For no-coverage mutants:

- add a real behavior test if the file is intentionally in mutation scope
- remove the file from mutation scope if it is generated, type-only, or not meaningful runtime code
- do not hide no-coverage results with broad ignores

For timeout mutants:

- look for loops, retries, polling, backoff, sleeps, timers, and async waits
- inject deterministic clocks or sleep functions where production behavior depends on time
- add bounds that fail fast even when a mutated statement changes loop progress
- rerun incrementally after each timeout fix

### 5. Keep test improvements behavior-first

Mutation testing should make the suite more honest, not more coupled.

Prefer:

- API tests through the HTTP boundary for routes, validation, cache, and contract behavior
- repository tests with real temporary databases for SQL behavior
- importer tests with realistic upstream fixtures and observable stored output
- focused unit tests for pure mappers, parsers, and calculations

Avoid duplicate tests that only kill the same mutant at multiple layers. Keep the smallest test with the strongest behavioral signal.

### 6. Rerun until clean or clearly justified

A clean mutation run should report:

- `100%` mutation score when the repo uses strict thresholds
- `0` survived mutants
- `0` no-coverage mutants
- `0` timed-out mutants

If a non-clean result remains, state exactly why it is accepted, what file or branch is involved, and whether a config change, code simplification, or future test is the right follow-up.

## Anti-Patterns

- Running mutation tests before regular tests can pass
- Lowering thresholds to make survivors disappear
- Expanding timeouts before investigating why mutants hang
- Mutating frontend UI code by default when behavior tests already cover the meaningful user flows
- Adding assertions against private helper calls just to kill a mutant
- Keeping broad defensive branches only because coverage or mutation tooling found them
- Mutating generated, type-only, declaration, or build artifact files
- Treating no-coverage or timeout mutants as less important than survived mutants

## Expected Behavior When This Skill Is Used

When applying this skill to a task:

1. Decide whether mutation testing is warranted for the backend change.
2. Inspect and preserve the repo's existing mutation setup.
3. Run the configured or narrowest honest incremental mutation check.
4. Keep reruns and reporting scoped to the changed behavior and actionable mutants.
5. Triage survived, no-coverage, and timeout mutants as quality failures.
6. Fix survivors through behavior tests or production simplification.
7. Fix no-coverage and timeout outcomes at their root cause.
8. Report the mutation result, remaining mutants if any, and the exact residual risk.
