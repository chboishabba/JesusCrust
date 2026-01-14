# JesusCrust

## What This Is

JesusCrust is a Rust/WASM-powered state and scheduling core for JavaScript UIs that batches DOM work to reduce lag in large, highly dynamic pages. The DOM remains in JS while state graphs, scheduling, and effect planning live in Rust.

## Core Value

Deliver deterministic, batched UI commits that keep the main thread responsive under heavy update pressure.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Standalone execution harness that validates transactional ticks, deferred DOM effects, and microtask coalescing.
- [ ] QuickJS embedding to run JS fixtures against a fake DOM host.
- [ ] Effect log with commit and rollback semantics.
- [ ] Deterministic replay of effect logs for validation.

### Out of Scope

- Browser integration — defer until core semantics are proven.
- Servo or custom rendering engine — out of scope for MVP.
- Performance benchmarks — wait until core semantics are stable.
- Drop-in acceleration for existing apps — treated as research track, not v1.
- Workers / SharedArrayBuffer — avoid until core semantics land.

## Context

- The repository is in planning; no implementation yet.
- Architecture sketch lives in `README.md` and emphasizes batched JS↔WASM boundaries.
- Early work centers on a standalone harness that validates scheduling semantics before any browser/DOM integration.
- The working concept name in notes is JavaCrust; repo name is JesusCrust.

## Constraints

- **Tech stack**: Rust core with future WASM target, JS host for DOM writes — aligns with batching rule.
- **Determinism**: Execution harness must support deterministic replay of effect logs for validation.
- **Scope**: Phase 1 focuses on semantics and harness behavior, not performance or integration.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MVP scope is Rust/WASM core + JS host; drop-in acceleration is research-only | Avoid scope creep while validating semantics | — Pending |
| Phase 1 uses a QuickJS-powered harness with a fake DOM host | Enables deterministic JS execution without browser dependency | — Pending |
| Use rquickjs with explicit job queue draining for microtask coalescing | Keeps harness deterministic while modeling JS microtasks | ✓ Good |
| Forbidden ops trigger rollback at commit time | Preserves committed state while capturing invalid writes | ✓ Good |

---
*Last updated: 2026-01-14 after initializing Phase 1 planning.*
