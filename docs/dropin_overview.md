# Drop-in Adapter Overview

The drop-in adapter enforces a **transactional, deterministic host contract** for renderers. It treats every renderer as untrusted: effects are buffered, validated, and committed exactly once per tick so downstream hosts and tooling can trust what they observe.

## Execution invariants

- **Single-commit per tick:** every macrotask (plus its drained microtasks) produces at most one commit; the host rejects writes outside that window.
- **Deferred mutation:** DOM-equivalent state is mutated only during the commit; intermediate state is invisible to renderers and observers until commit returns.
- **Event-phase separation:** event handlers run after a commit completes; no handler re-enters the mutation window.
- **Rollback/fallback safety:** unsupported reads or invariant violations trigger rollback/fallback batches that leave committed state untouched and emit diagnostics.
- **Deterministic replay:** identical initial state + PatchBatch input always serializes/fingerprints to the same value.
- **Stable identity:** NodeIds are preserved across rerenders, keyed reorders, and even nested keyed moves.

## Regression suite (semantic gate)

All of the following proofs are exercised by the same `npm test` script under `prototypes/dropin/`:

1. Microtask coalescing keeps all Promise-based updates in a single tick.
2. Mutation guard throws when writes happen outside `runMutating`.
3. Identity reuse tests cover flat keys, keyed order changes, nested keyed groups, and conditional keyed mounts.
4. Rollback + fallback tests confirm aborted ticks leave the DOM unchanged and diagnostics are recorded.
5. Replay instrumentation hashes serialized state to prove determinism.
6. Renderer stress tests (stateful Preact tick, event→state loops, Preact demo) show a real renderer obeys the contract while emitting deterministic batches.

## Virtualization scenario

Large lists can be expressed as renderer workloads by emitting only the visible rows into the adapter. The virtualization helper (`prototypes/dropin/virtualizer.js`) and its test feed a sliding window of rows to the renderer, prove each tick commits at most the window’s worth of nodes, and assert overlapping rows preserve NodeIds across shifts. This shows virtualization does not require new host APIs—just another renderer that respects the single-commit invariant.

## Non-goals

- This is **not** a replacement for the browser DOM or its APIs. It is a **semantics boundary** for host execution.
- It is **not** a benchmarking effort; performance tuning comes later.
- It does **not** support concurrent React/async rendering modes yet.
- It does **not** aim to expose every DOM API (e.g., layout reads happen via controlled fallbacks only).

## Running the semantic gate

```bash
cd prototypes/dropin
npm install
npm run conformance   # Phase-5 semantic gate; `npm test` simply proxies to this.
```

Make sure the entire suite passes before any change touches ticks, patches, or renderer wiring. The tests are the running definition of Phase 5’s correctness.
