# Changelog

## v0.1.0 — 2026-01-14

- Phase 1: QuickJS harness with fake DOM, transactional effect log, microtask draining, and deterministic replay
- Phase 2: Rust core with deterministic graph/store/selector, patch ops, scheduler, and engine batching
- Phase 3: JS host with DOM-equivalent model, mutation guard, commit boundary enforcement, replay + fingerprint, rollback/fallback no-ops, documented host-core API
- Phase 4: Developer experience docs and runnable quickstart example

Milestone: Initial end-to-end semantics proven and documented.
