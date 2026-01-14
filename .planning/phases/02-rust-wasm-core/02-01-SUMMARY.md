---
phase: 02-rust-wasm-core
plan: 01
subsystem: runtime
tags: [rust, core, dependency-graph, store, selector]

requires:
  - phase: 01-execution-harness
    provides: QuickJS harness semantics validation and fixture-driven tests
provides:
  - crust_core crate scaffold with NodeId
  - Deterministic dependency graph primitives
  - Store and selector dependency tracking
affects: [Phase 2, Phase 3]

tech-stack:
  added: []
  patterns: [ordered dependency traversal, selector dependency tracking]

key-files:
  created:
    - crates/core/Cargo.toml
    - crates/core/src/types.rs
    - crates/core/src/graph.rs
    - crates/core/src/store.rs
    - crates/core/src/selector.rs
    - crates/core/tests/graph.rs
    - crates/core/tests/store.rs
  modified:
    - Cargo.toml
    - crates/core/src/lib.rs

key-decisions:
  - "Dependency graph uses ordered sets/maps for deterministic traversal."

patterns-established:
  - "Selectors register dependencies on read via SelectorContext."

issues-created: []

duration: 52 min
completed: 2026-01-14
---

# Phase 2 Plan 1: Core Store + Graph Summary

**crust_core establishes deterministic graph and selector-aware store primitives for the WASM core.**

## Performance

- **Duration:** 52 min
- **Started:** 2026-01-14T02:10:00Z
- **Completed:** 2026-01-14T03:02:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Added `crust_core` crate with NodeId foundation types
- Implemented deterministic dependency graph with ordering tests
- Added Store + Selector dependency tracking with selector recompute tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold crust_core crate and core types** - `4d43392` (feat)
2. **Task 2: Implement deterministic dependency graph** - `da1b732` (feat)
3. **Task 3: Implement store + selector dependency tracking** - `037df09` (feat)

## Files Created/Modified
- `Cargo.toml` - Added `crates/core` workspace member
- `crates/core/Cargo.toml` - Core crate manifest
- `crates/core/src/types.rs` - NodeId newtype
- `crates/core/src/graph.rs` - Deterministic dependency graph
- `crates/core/src/store.rs` - Store value map
- `crates/core/src/selector.rs` - Selector context and dependency tracking
- `crates/core/tests/graph.rs` - Graph ordering tests
- `crates/core/tests/store.rs` - Store/selector tests
- `crates/core/src/lib.rs` - Module exports

## Decisions Made
- Dependency graph uses ordered containers to keep traversal deterministic.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

None.

## Next Phase Readiness

Ready for 02-02-PLAN.md (scheduler + patch ops).

---
*Phase: 02-rust-wasm-core*
*Completed: 2026-01-14*
