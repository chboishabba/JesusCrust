# JesusCrust

## What This Is

JesusCrust is a Rust/WASM-powered state and scheduling core for JavaScript UIs that moves heavy compute off the main thread while keeping DOM commits deterministic and budgeted. The DOM remains in JS while state graphs, scheduling, diffing, and effect planning live in Rust/WASM workers.

## Core Value

Deliver off-main-thread compute with deterministic, bounded UI commits that keep the main thread responsive under heavy update pressure.

## Requirements

### Validated

- Deterministic transactional ticks with commit/rollback semantics.
- JS host mutation guards and single-commit enforcement.
- Drop-in adapter contract with replayable fingerprints.
- Guarded browser host prototype with telemetry surfaces.

### Active

- [ ] Phase-6 telemetry runs against real workloads (ChatGPT long chats, dense feeds).
- [ ] Feature-flagged selector invalidation planning telemetry and A/B validation.
- [ ] Worker protocol draft for off-thread planning and bounded commit application.

### Out of Scope

- Parallel JavaScript execution that bypasses the tick → commit → fallback model.
- DOM integration that weakens commit guards or allows mid-tick visibility.
- Site-specific hacks in engine code.

## Context

- Core semantics and the host boundary are implemented and documented.
- Phase-6 focuses on guarded browser rollout and telemetry-driven attribution.
- Architecture sketch lives in `README.md` and emphasizes off-thread compute with budgeted commits.
- The working concept name in notes is JavaCrust; repo name is JesusCrust.

## Constraints

- **Tech stack**: Rust core with WASM target, JS host for DOM writes, worker-friendly boundaries.
- **Determinism**: Execution harness must support deterministic replay of effect logs for validation.
- **Commit budget**: Main-thread commits remain bounded and deterministic, even when compute moves off-thread.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MVP scope is Rust/WASM core + JS host; drop-in acceleration is research-only | Avoid scope creep while validating semantics | — Pending |
| Phase 1 uses a QuickJS-powered harness with a fake DOM host | Enables deterministic JS execution without browser dependency | — Pending |
| Use rquickjs with explicit job queue draining for microtask coalescing | Keeps harness deterministic while modeling JS microtasks | ✓ Good |
| Forbidden ops trigger rollback at commit time | Preserves committed state while capturing invalid writes | ✓ Good |
| Multithreading is the headline; bounded commits are the constraint | Preserve deterministic main-thread commits while parallelizing compute | ✓ Active |

---
*Last updated: 2026-01-17 after Phase 6 framing update.*
