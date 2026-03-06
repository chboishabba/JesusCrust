# JesusCrust

A Rust/WASM-powered state and scheduling core for JavaScript UIs aimed at reducing lag in large, highly dynamic pages.
The core idea is to move heavy compute off the main thread while keeping DOM writes in JS and committing patches deterministically under a tight main-thread budget.

## Goals

- Move expensive compute (state updates, diffing, parsing) off the main thread without changing JS semantics.
- Commit DOM patches deterministically under a bounded, one-commit-per-tick budget.
- Provide a reactive store with fine-grained dependency tracking and stable node IDs.
- Enable built-in virtualization for large lists and feeds.

## Architecture Sketch

- Rust/WASM workers: store, selectors, dependency graph, scheduling, diffing, patch generation.
- JS host: applies patch ops to the DOM in a single commit on the main thread.
- Boundary rule: cross JS↔WASM in batches, not per node; keep commits deterministic and budgeted.

## Planning

Project planning artifacts live in `.planning/`.

## Getting Started (Phase 3)

- API surface: `docs/api.md`
- Host-core contract: `docs/host-core-api.md`
- Runnable example: `node examples/quickstart.js`
