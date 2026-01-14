---
phase: 02-rust-wasm-core
type: discovery
topic: WASM boundary options and patch-op data layout
---

<session_initialization>
2026-01-14
</session_initialization>

<discovery_objective>
Discover WASM boundary options and data layout considerations for Phase 2 core design.

Purpose: Decide how to structure core types so they remain WASM-ready without committing to a binding tool yet.
Scope: Interface options (wasm-bindgen vs WIT/component model) and implications for data layout.
Output: DISCOVERY.md with recommendation and validation checkpoints.
</discovery_objective>

<discovery_scope>
<include>
- What wasm-bindgen is optimized for (Rust↔JS interop) and how it shapes data types.
- What WIT/component model bindings are intended for.
- How to keep the Phase 2 core independent of the binding choice.
</include>

<exclude>
- Implementing WASM bindings in Phase 2.
- Performance tuning or benchmarks.
- JS host integration details (Phase 3).
</exclude>
</discovery_scope>

<discovery_protocol>
Source Priority:
1. Official docs (wasm-bindgen guide)
2. Official project README (wit-bindgen/component model)
3. WebSearch (not used)
</discovery_protocol>

# WASM Boundary Discovery

## Summary
The wasm-bindgen guide positions wasm-bindgen as the primary Rust↔JS interop tool, shaping how types are passed between Rust and JavaScript. The wit-bindgen project targets WebAssembly component model bindings defined via WIT, emphasizing interface definitions for imports/exports. Given Phase 2 focuses on the Rust core (state graph, scheduler, patch ops) rather than JS integration, the safest path is to keep the core pure Rust and define patch ops in a serializable, JS-agnostic form. The binding decision can be deferred to Phase 3 when the JS host boundary is implemented.

## Primary Recommendation
Keep Phase 2 as a pure Rust core with explicit patch-op structs/enums and avoid binding-specific types. Treat wasm-bindgen vs WIT as a Phase 3 decision; design data shapes that can be serialized either way.

## Alternatives Considered
- Commit to wasm-bindgen now (tighter Rust↔JS coupling, faster JS host wiring).
- Commit to WIT/component model now (IDL-driven interface, more formal bindings).

## Key Findings

### wasm-bindgen focus
- wasm-bindgen is a Rust library + CLI that facilitates high-level interactions between Wasm modules and JavaScript, with guidance on supported types and interop patterns.
  (https://rustwasm.github.io/docs/wasm-bindgen/)

### WIT/component model focus
- wit-bindgen targets bindings based on WIT definitions for the WebAssembly component model, emphasizing explicit import/export interfaces.
  (https://github.com/bytecodealliance/wit-bindgen)

### Implication for Phase 2
- Both approaches are viable, but neither is required to implement core scheduling/data structures. Deferring the binding choice reduces coupling risk while the core is still in flux.

## Code Examples

None required at this stage; Phase 2 avoids binding-specific code.

## Metadata

<metadata>
<confidence level="medium">
Sources describe intended use-cases for wasm-bindgen and WIT bindings, but no project-specific benchmarking was needed for this decision.
</confidence>

<sources>
- https://rustwasm.github.io/docs/wasm-bindgen/
- https://github.com/bytecodealliance/wit-bindgen
</sources>

<open_questions>
- Should patch ops be serialized as fixed-size buffers or variable-length records for JS host efficiency?
- When Phase 3 starts, should the boundary use wasm-bindgen or WIT/component model?
</open_questions>

<validation_checkpoints>
- Re-evaluate binding choice at Phase 3 after JS host constraints are known.
- Verify patch-op data layout with JS host prototype before committing to a wire format.
</validation_checkpoints>
</metadata>
