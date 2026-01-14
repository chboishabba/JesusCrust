---
phase: 01-execution-harness
type: discovery
topic: QuickJS embedding in Rust (rquickjs) for harness runner
---

<session_initialization>
2026-01-14
</session_initialization>

<discovery_objective>
Discover the best QuickJS embedding approach for the Phase 1 execution harness.

Purpose: Choose a Rust QuickJS binding and confirm the minimal API surface needed for running JS fixtures and capturing effect logs.
Scope: Rust-side embedding strategy and host API shape only (no browser DOM integration).
Output: DISCOVERY.md with recommendation and validation checkpoints.
</discovery_objective>

<discovery_scope>
<include>
- Which Rust QuickJS binding should be used for a small, deterministic harness?
- Minimal host API patterns (register effect, enqueue microtask, begin/commit/rollback) supported by the binding.
- How to load and execute JS fixture files from Rust.
</include>

<exclude>
- Browser DOM integration or Web APIs.
- Performance profiling or benchmarking.
- WASM boundary design (Phase 2 concern).
</exclude>
</discovery_scope>

<discovery_protocol>
Source Priority (accessed):
1. docs.rs (official rustdoc for rquickjs)
2. Context7 MCP (not used)
3. WebSearch (not used)
</discovery_protocol>

# QuickJS Embedding Discovery

## Summary
This discovery reviews QuickJS embedding options for the Phase 1 harness. The docs.rs rustdoc for `rquickjs` confirms it provides safe high-level QuickJS bindings with `Runtime` and `Context` as the primary entry points, plus optional features for module loading and async integration. This aligns with a minimal harness that registers a tiny host API, loads JS fixtures, and executes deterministically.

## Primary Recommendation
Use `rquickjs` as the QuickJS binding for the harness. It exposes `Runtime` and `Context` types, with optional `loader` feature support for custom module resolvers/loaders. Use a small host API via function registration and keep the harness single-threaded (QuickJS runtime is mutex-guarded). Defer async runtime unless microtasks require `futures` integration.

## Alternatives Considered
- `quickjs` (FFI bindings) — likely viable but may have a lower-level API surface and more unsafe glue.
- Embedding a different JS engine (e.g., Boa) — out of scope for this phase and risks changing semantics.

## Key Findings

### Binding selection
- `rquickjs` provides safe high-level bindings to QuickJS with `Runtime` and `Context` as the entry points, and supports async variants when `futures` is enabled. (docs.rs/rquickjs)

### Module/fixture loading
- The `loader` feature enables custom ES6 module resolvers and loaders via `Resolver` and `Loader` traits, and `Runtime::set_loader` allows plugging them in before loading modules. (docs.rs/rquickjs)

### Concurrency and determinism
- QuickJS runtimes are locked behind a mutex; multiple threads cannot run scripts or create objects simultaneously. This fits a deterministic, single-threaded harness. (docs.rs/rquickjs)

## Code Examples

Pseudo-outline (based on docs.rs overview; verify exact APIs in implementation):

- Create `Runtime` + `Context`
- Register host functions (e.g., `host.register_effect(...)`)
- Load fixture script text and evaluate
- Execute microtasks if the binding exposes a job queue runner

## Metadata

<metadata>
<confidence level="medium">
Docs.rs rustdoc covers core types and feature flags, but implementation details for job queues/microtasks require validation during coding.
</confidence>

<sources>
- https://docs.rs/rquickjs/latest/rquickjs/
</sources>

<open_questions>
- What is the current `rquickjs` API for registering host functions and running the job queue/microtasks?
- Does fixture loading prefer module loaders (`loader` feature) or eval of script text for this harness?
- Are there specific feature flags needed for microtasks/job queue execution beyond `futures`?
</open_questions>

<validation_checkpoints>
- Confirm `rquickjs` runtime/context setup and host function registration from docs/examples.
- Verify job queue or microtask execution support and how to invoke it per macrotask.
- Validate file/module loading approach for fixture execution.
</validation_checkpoints>
</metadata>
