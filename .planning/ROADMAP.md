# Roadmap: JesusCrust

## Overview

Establish deterministic scheduling semantics in a standalone harness first, then build the Rust/WASM core and JS host that apply those semantics to real DOM workloads.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Execution Harness** - QuickJS-driven harness with fake DOM, effect log, and deterministic replay.
- [ ] **Phase 2: Rust/WASM Core** - Store, dependency graph, scheduler, and patch op generation.
- [ ] **Phase 3: JS Host Integration** - JS host applies patch ops and validates batching boundary.
- [ ] **Phase 4: Developer Experience** - Public API sketch, docs, and example scenarios.
- [ ] **Phase 5: Drop-in Acceleration Research** - Investigate feasibility of drop-in acceleration for existing apps (research track).

## Phase Details

### Phase 1: Execution Harness
**Goal**: Implement a standalone JavaCrust execution harness validating transactional ticks, deferred DOM effects, and microtask coalescing.
**Depends on**: Nothing (first phase)
**Research**: Likely (QuickJS embedding details)
**Plans**: 1 plan

Plans:
- [x] 01-01: Execution harness (QuickJS, fake DOM, effect log, deterministic replay)

### Phase 2: Rust/WASM Core
**Goal**: Implement state graph, scheduler, and patch op generation targeting a WASM boundary.
**Depends on**: Phase 1
**Research**: Likely (WASM host boundary and data layout)
**Plans**: TBD

Plans:
- [x] 02-01: Core store and dependency graph
- [x] 02-02: Scheduler + patch op serialization

### Phase 3: JS Host Integration
**Goal**: JS host applies patch ops and enforces single batched commit semantics.
**Depends on**: Phase 2
**Research**: Unlikely (internal integration)
**Plans**: TBD

Plans:
- [x] 03-01: JS host runner and patch applier
- [x] 03-02: Host-side constraints + debug tooling

### Phase 4: Developer Experience
**Goal**: Document API surface and provide example scenarios for early adopters.
**Depends on**: Phase 3
**Research**: Unlikely
**Plans**: 1 plan

Plans:
- [x] 04-01: API sketch, docs, and examples

### Phase 5: Drop-in Acceleration Research (INSERTED)
**Goal**: Assess feasibility and constraints for drop-in acceleration of existing apps using the JesusCrust runtime.
**Depends on**: Phase 3/4 (semantics + API defined)
**Research**: Deep (integration/compat)
**Plans**: TBD

Plans:
- [ ] 05-01: Research plan (discovery + constraints)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Execution Harness | 1/1 | Complete | 2026-01-14 |
| 2. Rust/WASM Core | 2/2 | Complete | 2026-01-14 |
| 3. JS Host Integration | 2/2 | Complete | 2026-01-14 |
| 4. Developer Experience | 1/1 | Complete | 2026-01-14 |
| 5. Drop-in Acceleration Research | 0/1 | Not started | - |
