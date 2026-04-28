# Mutation Triage Checklist

Use this checklist when setting up mutation testing or making a non-clean mutation run actionable.

## Backend Config Shape

For backend TypeScript projects using Stryker, a strong practical setup usually has:

- `mutate` limited to backend production files with real behavior
- the repo's normal test runner wired through Stryker
- incremental mode enabled
- per-test coverage analysis when supported
- TypeScript checking enabled
- capped worker concurrency for predictable local runs
- strict thresholds when the project expects zero surviving mutants
- reporters that make local triage readable
- test files ordered from focused and fast to broad and slow

Keep mutation testing outside the default fast verification command unless the repo explicitly wants mutation testing in that gate.

## When To Run

Run mutation tests when the change touches meaningful backend behavior:

- files included in the repository's configured mutation range
- request validation and error mapping
- API response shapes, metadata, pagination, cache headers, or ETags
- auth and environment-sensitive runtime behavior
- SQL queries, transactions, upserts, pruning, and repository boundaries
- importer, scraper, sync, retry, backoff, or idempotency logic
- pure mappers and normalizers that affect stored or returned data
- risky refactors where normal tests might preserve coverage without preserving intent

Usually skip mutation tests for:

- frontend-only UI changes covered by Testing Library or E2E user flows
- docs, formatting, generated files, lockfile-only updates, or static metadata
- type-only source changes that erase at runtime
- exploratory implementation before focused tests pass

## Token And Cost Discipline

- Start with the narrowest mutation target that still reaches the changed backend behavior.
- Use incremental or cached reruns whenever the tool supports them.
- Avoid repeated full mutation runs after each small assertion or production edit.
- Open detailed reports only for survived, no-coverage, timed-out, or otherwise actionable mutants.
- Do not copy large mutation reports into the conversation; report command, scope, score, counts, and the unresolved mutant locations.
- Broaden the mutation scope only when the current target cannot prove affected behavior or the repo's quality gate requires a full run.

## Outcome Triage Matrix

| Outcome       | What it usually means                                                                    | Best response                                                                           | Avoid                                   |
| ------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------- |
| Survived      | A test executed the code but did not observe the changed behavior                        | Add or strengthen a behavior assertion, or simplify unreachable code                    | Private implementation assertions       |
| No coverage   | The mutated file or branch is in scope but no selected test reaches it                   | Add a realistic test or remove the file from mutation scope if it should not be mutated | Broad ignore patterns                   |
| Timed out     | A mutant caused a loop, retry, timer, async wait, or expensive path to stop failing fast | Add bounds, deterministic time, injected sleep, or a focused test that fails fast       | Only raising global timeouts            |
| Compile error | The mutant produced code that cannot compile                                             | Usually acceptable as killed by the checker                                             | Disabling checkers to gain speed        |
| Killed        | A test or checker detected the mutant                                                    | No action needed unless the killing test is too broad or slow                           | Duplicating assertions at another layer |

## Test Patterns That Kill Useful Mutants

### API and HTTP boundaries

- Assert complete public response shapes for important routes.
- Assert clear `400`, `401`, `403`, `404`, and `500` bodies when those are part of the contract.
- Assert cache headers, ETags, canonical route keys, and revalidation behavior when present.
- Assert pagination, sorting, filters, defaults, limits, and metadata together with returned data.
- Use live route/app integration tests when behavior spans handlers, validation, repositories, and persistence.

### Repositories and SQL

- Use temporary real databases when SQL behavior matters.
- Cover nullable values, edge values, joins, grouping, ordering, limits, and empty results.
- Cover replacement, upsert, pruning, and transaction behavior with stored data before and after the operation.
- Prefer observable repository output and persisted rows over query-construction internals.

### Importers, scrapers, and sync jobs

- Use realistic upstream fixtures.
- Cover idempotent reruns, stale versus fresh data, partial failures, retries, and bounded backoff when those exist.
- Assert operator-visible summaries or progress events when they are part of the behavior.
- Verify that existing good data is preserved or pruned only under the intended success conditions.

### Pure mappers and validators

- Keep focused unit tests for deterministic mapping, parsing, normalization, and validation rules.
- Include missing, null, malformed, boundary, and default cases that real inputs can produce.
- Do not preserve fallback branches that no upstream data, route, or runtime path can reach.

## Timeout Mutant Response

When a mutant times out, inspect the production path before changing config:

- Can a mutated increment, condition, retry count, or break statement make a loop unbounded?
- Does a retry path depend on real sleeping instead of injected sleep?
- Is a clock, timer, or polling delay real in tests when it could be deterministic?
- Does the test wait for broad integration behavior when a focused test could fail faster?
- Can production code enforce a maximum attempt, page, batch, or item count independent of mutated progress state?

Raise per-mutant or global timeouts only after the code and tests already fail fast for realistic behavior.

## No-Coverage Response

Before ignoring no-coverage mutants, decide what the code represents:

- Runtime backend behavior in scope: add a realistic test.
- Type-only or declaration-like source: exclude or ignore narrowly.
- Generated artifact or source-map artifact: exclude from mutation scope.
- Platform branch that cannot run in the current environment: ignore narrowly with a short reason.
- Defensive branch with no real scenario: simplify or remove it.

## Clean Run Bar

For strict backend projects, a clean run means:

- mutation score is `100%`
- survived count is `0`
- no-coverage count is `0`
- timed-out count is `0`

Report any exception as a concrete residual risk, not as a vague testing limitation.

## Final Reporting Pattern

Keep the handoff short:

- mutation command run
- changed test or production behavior that killed mutants
- final score and counts
- any remaining survivor, no-coverage, timeout, or blocked run with the exact reason
