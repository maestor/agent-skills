---
name: clean-code-typescript
description: Apply Robert C. Martin’s Clean Code principles when writing, refactoring, or reviewing TypeScript and TSX. Use for decisions about naming, domain types, function responsibilities, side effects, and abstractions that affect how callers read and use the code.
---

# Clean Code for TypeScript

Start at a real call site. Identify the decision the code makes, the terms the project uses for it, and the behavior callers rely on. Use those as the basis for a new implementation or a local cleanup.

## Make intent visible at the call site

- Use the same domain term across the type, implementation, and caller. Put units in names when confusing them would change behavior, as in `retryDelayMs`. Name a business threshold for the rule that owns it.
- Read calls without the parameter declarations. If `sendInvoice(invoice, true)` requires a lookup to discover that `true` sends a reminder, use the domain operation `sendInvoiceReminder(invoice)` or an explicit mode when both modes belong to the same operation.
- Keep a function focused on one outcome. Extract a predicate when its name explains a decision, or a helper when it lets the caller read the steps at one level of detail. Keep a short calculation inline when moving it would only make the reader jump between files.
- Use comments for information the code cannot express, such as why a provider requires a particular retry delay. Let the repository formatter handle layout.

## Let types carry the rules

When fields depend on each other, encode that relationship once. For an internal delivery state, `{ sent: boolean, sentAt?: Date }` makes every consumer decide what a missing timestamp means. If every sent delivery has a timestamp, a discriminated union can express that guarantee.

```ts
type Delivery =
  | { status: "queued" }
  | { status: "sent"; sentAt: Date };
```

Branching on `delivery.status` gives the sent branch a `Date`. Check the invariant against real inputs before adopting it. If older stored records lack a timestamp, handle those records at the read boundary and preserve their meaning.

At an external boundary, start with `unknown` when the shape is unverified. Reuse the project's parser or narrow the value before passing it to domain code. A type assertion such as `payload as Delivery` cannot validate JSON or convert a timestamp string to a `Date`.

## Separate decisions from effects

- Keep reads, writes, and failure handling visible in the function that coordinates them. For example, retry eligibility can take an attempt count and the current time as inputs. The caller can then schedule the retry. Preserve the order of effects and the errors callers observe when making this split.
- Share an implementation when its callers depend on the same rule and should change together. A quote may be valid for 30 days and an invoice due in 30 days. Give each policy its own name if the sales team can change quote validity independently of payment terms.
- Pass the smallest dependency the calculation needs. An eligibility check can accept `now: Date` if one instant is enough. A polling loop that needs a fresh time on each iteration can take a clock function.

## Refactor and review

Keep cleanup close to the requested change. Check exported signatures, stored representations, and failure behavior before renaming or narrowing anything callers can observe. For a refactor, run the relevant existing behavior tests before and after the edit. Add a characterization test when a consequential behavior has no coverage. Use the project's type check and required verification commands.

For a review, point to the call site or change scenario that exposes the problem, explain the consequence, and suggest the smallest improvement. A function's line count alone gives little reason to split it.

These guidelines adapt Robert C. Martin’s principles to TypeScript. [Clean Code summary by wojteklu](https://gist.github.com/wojteklu/73c6914cc446146b8b533c0988cf8d29)
