# Phase 3: JS Host Integration - Context

**Gathered:** 2026-01-14
**Status:** Ready for planning

<vision>
## How This Should Work

Phase 3 introduces a minimal JavaScript host that receives patch batches from the core runtime and applies them to a real DOM (or DOM-equivalent). The host enforces one commit per tick, preserves deterministic ordering, and keeps replayability intact so the execution model is validated against an observable host.

This phase is where commit semantics meet an imperative host, so batching boundaries must stay meaningful and deterministic even with DOM-like side effects.

</vision>

<essential>
## What Must Be Nailed

- Correctness of patch application and commit boundary enforcement (one commit per tick)
- Deterministic ordering and replayability of patch batches
- A clear, minimal host API surface that is stable enough to reason about

</essential>

<boundaries>
## What's Out of Scope

- Performance benchmarking or tuning
- Browser integration specifics (Servo/Chromium/extension targets)
- Devtools or debug UI
- Worker, SharedArrayBuffer, or multithreading support

</boundaries>

<specifics>
## Specific Ideas

- Minimal, test-driven JS host with fixtures and assertions
- Tests should assert one commit per tick, patch order preservation, and no mid-tick DOM visibility

</specifics>

<notes>
## Additional Context

Phase 3 should remain a semantic validation phase rather than a UX/demo phase. If a demo exists, it should be a thin wrapper around the test harness rather than driving requirements.

</notes>

---
*Phase: 03-js-host-integration*
*Context gathered: 2026-01-14*
