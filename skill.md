---
name: bitmon-engineering-discipline
description: Mandatory engineering rules for coding agents contributing to bitmon, covering minimal testing, PR integration, dead-code elimination, and code simplification.
---

# bitmon — Engineering Rules for Coding Agents

**Scope:** Every agent working on this repository. These are **merge gates**, not suggestions. Follow the [Product Requirements](docs/PRODUCT_REQUIREMENTS.md) for product behavior and the [Technical Design](docs/TECHNICAL_DESIGN.md) for protocol constraints. The [Development Tracker](docs/DEVELOPMENT_TRACKER.md) records progress; it does not override requirements.

## 1. Keep the automated test suite exceptionally small

**Default: do not add a test.** A test is permanent code with maintenance cost, execution cost, and the potential to obstruct legitimate changes. The goal is the **smallest useful test suite, including zero tests where justified**, not a high test count or a coverage percentage.

Only automate a test when it protects a **fundamental invariant or genuinely high-impact failure** that would otherwise be difficult to detect reliably. Examples of candidates—not a checklist of tests to create—include canonical state integrity, authorization/ownership safety, deterministic rule consistency, and the prohibition on inventing roads or buildings absent from OpenFreeMap.

Before adding **any** test, the agent MUST:

1. State the specific invariant, credible failure mode, and consequence if it breaks.
2. Check whether an existing test already protects that invariant; improve or broaden it instead of adding another test whenever possible.
3. Actively look for a **redundant, obsolete, overlapping, or lower-value test to delete or consolidate**. Every proposed addition triggers an explicit test-suite reduction review.
4. Prefer the smallest deterministic test at the lowest useful level. Avoid duplicate coverage across unit, integration, and end-to-end layers.
5. Confirm that the test is stable, understandable, inexpensive to run, and valuable enough to maintain indefinitely.

**Do not add** speculative tests, trivial getter/setter tests, snapshot churn, redundant happy-path variations, tests written merely to raise coverage, or extensive mocks that test the mocks rather than the product. Do not introduce a testing framework for a single marginal scenario. Do not retain obsolete tests after the underlying behavior is removed.

**Do not delete the last meaningful guard for a critical invariant just to reduce the count.** The objective is minimal *essential* protection, not a numerical quota. For behavior that does not justify permanent automation, use targeted manual verification or an ephemeral local check; describe what was verified in the PR without adding permanent test files.

**Required PR accounting:** State (a) tests added, (b) tests removed/consolidated, (c) the resulting net change, and (d) why each remaining **new** test is indispensable. For a PR with no new tests, say so explicitly. Never claim validation that was not performed.

## 2. All development flows through pull requests into `preview`

- `main` is the release/stable branch; `preview` is the integration branch.
- Start each change from the current `preview` head in a **short-lived feature or fix branch**.
- Open a PR with **base `preview`**. Do not push commits directly to `preview` or `main`, and do not open ordinary feature PRs directly to `main`.
- Keep the PR focused on an outcome, but include cleanup of existing related code when it materially improves the result.
- Before requesting merge, synchronize with the latest `preview`, resolve conflicts, re-review the final diff, and run only the minimal relevant verification.
- A reviewed promotion of `preview` to `main` is a **separate release operation**; it is not a shortcut for ordinary development.
- If there is no `preview` branch, establish it from the current release branch before opening feature PRs.

**Do not merge a PR that fails either of the two gates below.** Opening a PR or passing a CI job is not sufficient approval.

## 3. Zero dead code — before committing and before merging

**Dead code must not enter a commit and must not remain on `preview`.** Every agent is responsible for both code introduced by the current task and dead code uncovered in previously merged work.

Before **each commit**, and again against the complete final PR diff before merge, inspect for:

- Unreachable branches, unused functions/classes/exports/modules, abandoned paths, and obsolete implementations.
- Unused imports, variables, assets, dependencies, feature flags, configuration, scripts, and tests.
- Commented-out code, unused compatibility wrappers, duplicated implementations, and placeholder code with no exercised purpose.
- Logic made redundant by the new design, including old call sites and now-unnecessary abstractions.

**Delete these rather than leaving them "for later."** Do not keep old and new implementations side by side without a real, currently supported runtime reason. No speculative scaffolding, no dormant alternatives, and no unreachable fallback paths.

If review exposes dead code **already on `preview`**, remove it in the current PR when safe, or block the merge until a separate cleanup PR removes it. Do not accept known dead code as pre-existing debt. Do not conceal an unresolved finding in a TODO.

Code retained for required compatibility is *not* dead if it has a concrete, supported caller or execution path; document that requirement and remove the code when it is no longer needed.

## 4. Simplify the whole codebase you touch — not only the current PR

A PR is an opportunity to improve the **existing `preview` baseline**, not merely to append functionality. Before merge, review the new code, its call sites, the relevant modules already in `preview`, and surrounding shared abstractions. Look for simpler and more efficient ways to deliver the same correct behavior.

Actively challenge:

- Can a function, layer, class, indirection, dependency, state variable, allocation, or data transformation be **removed**?
- Can two existing implementations become one clear implementation without introducing a premature abstraction?
- Does earlier code in this area remain unnecessarily complex after the new change?
- Is there repeated work, avoidable I/O, excessive rerendering, or a simpler algorithm/data flow that delivers a material performance gain?
- Are names, boundaries, and control flow clearer if the implementation is rewritten rather than incrementally patched?

**Make the improvement**, including revisions to **previously written code**, when the behavior is preserved and the change is reasonably reviewable. Deleting code is often better than adding a helper to work around it. Prefer a plain solution over cleverness, speculative generality, or an unnecessary framework.

Avoid broad churn that cannot be reviewed safely: if a substantial unrelated simplification is discovered, land it through its **own PR into `preview`**, and do not merge the dependent change while known dead code or directly relevant avoidable complexity remains. Efficiency claims must be grounded in a clear reduction of work or in measurement, not intuition alone.

## 5. Mandatory pre-merge review report

Every PR description or final agent review must include a short, factual record:

| Gate | Required evidence |
|---|---|
| **Target branch** | Feature branch based on current `preview`; PR targets `preview` |
| **Test necessity** | Tests added / removed / net change; why each new test is fundamental, or "No tests added" |
| **Dead-code audit** | New diff **and existing relevant `preview` code** inspected; obsolete code and dependencies removed |
| **Simplification audit** | Existing and new code reviewed for simpler/faster solutions; actual improvements described |
| **Validation** | Exact checks or manual scenarios run and results; do not imply a test suite was run if none exists |
| **Product fit** | Relevant requirement IDs or design constraints checked, including OpenFreeMap geometry fidelity where applicable |

**Reject or revise**, rather than merge, if any statement cannot be supported. Reviewers should consider the PR's end state, not merely whether each new line appears reasonable.

## 6. Operating principle

**Ship the smallest correct implementation, maintain the smallest defensible test suite, and leave `preview` simpler than you found it.** Product invariants and security boundaries are non-negotiable; they are reasons to preserve a rare essential test or necessary complexity, not excuses for unbounded scaffolding.
