# JesusCrust

A Rust/WASM-powered state and scheduling core for JavaScript UIs aimed at reducing lag in large, highly dynamic pages.
The core idea is to keep DOM writes in JS while moving state graphs, diffing, and scheduling into Rust for better batching and memory behavior.

## Goals

- Reduce main-thread churn by batching DOM patches and deferring work by priority.
- Provide a reactive store with fine-grained dependency tracking and stable node IDs.
- Enable built-in virtualization for large lists and feeds.

## Architecture Sketch

- Rust/WASM: store, selectors, dependency graph, scheduler, patch generation.
- JS host: applies patch ops to the DOM in a single frame.
- Boundary rule: cross JS↔WASM in batches, not per node.

## Planning

Project planning artifacts live in `.planning/`.

## Getting Started (Phase 3)

- API surface: `docs/api.md`
- Host-core contract: `docs/host-core-api.md`
- Runnable example: `node examples/quickstart.js`
